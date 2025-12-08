// hls-proxy.mjs
import dns from 'node:dns';
dns.setDefaultResultOrder?.('ipv4first');

import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream';
import process from 'node:process';

const app = express();
const PORT = process.env.PORT || 5174;

// Set HLS_ALLOW_RELAXED=true for broader host allowlist (debug).
const ALLOW_RELAXED = String(process.env.HLS_ALLOW_RELAXED || 'false').toLowerCase() === 'true';

// tiny color helpers
const color = (code, s) => `\x1b[${code}m${s}\x1b[0m`;
const cyan = (s) => color(36, s);
const green = (s) => color(32, s);
const yellow = (s) => color(33, s);
const red = (s) => color(31, s);

/* -------------------- Upstreams + per-host headers -------------------- */
const HOST_CONFIG = {
  // Al Jazeera (both hostnames seen in the wild)
  'live-hls-web-aje.getaj.net': { referer: 'https://www.aljazeera.com/' },
  'live-hls-aje-ak.getaj.net':  { referer: 'https://www.aljazeera.com/' },

  // DW
  'dwamdstream102.akamaized.net': {},
  'dwamdstream101.akamaized.net': {},

  // CNA (needs referer on some edges)
  'd2e1asnsl7br7b.cloudfront.net': {
    referer: 'https://www.channelnewsasia.com/',
    origin:  'https://www.channelnewsasia.com',
  },


  // Red Bull TV
  'rbmn-live.akamaized.net': {},
};

const ALLOW_HOSTS = new Set(Object.keys(HOST_CONFIG));

/* ---------------------------- Cookie jar ----------------------------- */
const COOKIE_JAR = new Map();   // hostname -> "k=v; k2=v2"
const COOKIE_TIME = new Map();  // hostname -> lastSetTime (ms)
const COOKIE_TTL_MS = 60 * 60 * 1000;

function setCookies(hostname, setCookieHeaders) {
  if (!setCookieHeaders) return;
  const prev = COOKIE_JAR.get(hostname) || '';
  const prevMap = new Map(
    prev
      .split(';')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((kv) => kv.split('='))
      .filter(([k, v]) => k && v)
  );
  const arr = Array.isArray(setCookieHeaders) ? setCookieHeaders : [setCookieHeaders];
  for (const sc of arr) {
    const m = sc.match(/^\s*([^=;]+)=([^;]+)/);
    if (m) prevMap.set(m[1], m[2]);
  }
  const cookieStr = Array.from(prevMap.entries()).map(([k, v]) => `${k}=${v}`).join('; ');
  COOKIE_JAR.set(hostname, cookieStr);
  COOKIE_TIME.set(hostname, Date.now());
}

function getCookies(hostname) {
  const t = COOKIE_TIME.get(hostname);
  if (t && Date.now() - t > COOKIE_TTL_MS) {
    COOKIE_JAR.delete(hostname);
    COOKIE_TIME.delete(hostname);
    return '';
  }
  return COOKIE_JAR.get(hostname) || '';
}

/* --------------------------- Allowlist logic -------------------------- */
function isAllowedHost(hostname) {
  if (ALLOW_HOSTS.has(hostname)) return true;
  if (ALLOW_RELAXED) {
    if (hostname.endsWith('.akamaized.net') || hostname.endsWith('.cloudfront.net')) {
      return true;
    }
  }
  return false;
}

/* ----------------------- Upstream header builder ---------------------- */
function upstreamHeaders(hostname, isPlaylist, req) {
  const ua =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36';
  const base = {
    'User-Agent': ua,
    'Connection': 'keep-alive',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept': isPlaylist
      ? 'application/vnd.apple.mpegurl,application/x-mpegURL,*/*'
      : '*/*',
  };

  const cfg = HOST_CONFIG[hostname];
  const headers = { ...base };
  if (cfg?.referer) headers.Referer = cfg.referer;
  if (cfg?.origin) headers.Origin = cfg.origin;
  if (!isPlaylist && req.headers.range) headers.Range = req.headers.range;
  return headers;
}

/* ------------------------ URL helpers / rewriting --------------------- */
function normalizeTarget(u) {
  const h = u.hostname;
  if (h.endsWith('.akamaized.net') && u.protocol === 'http:') {
    return new URL(u.toString().replace(/^http:/, 'https:'));
  }
  return u;
}
const proxify = (absUrl, proxyOrigin) =>
  `${proxyOrigin}/hls?url=${encodeURIComponent(absUrl)}`;

function rewritePlaylist(content, baseUrl, proxyOrigin) {
  const rewriteAttrUris = (line) =>
    line.replace(/URI="([^"]+)"/g, (_m, uri) => {
      const abs = new URL(uri, baseUrl).toString();
      return `URI="${proxify(abs, proxyOrigin)}"`;
    });

  return content
    .split('\n')
    .map((line) => {
      const s = line.trim();
      if (!s) return line;
      if (s.startsWith('#')) {
        return s.includes('URI="') ? rewriteAttrUris(line) : line;
      }
      const abs = new URL(s, baseUrl).toString();
      return proxify(abs, proxyOrigin);
    })
    .join('\n');
}

/* ------------------------------- Utils -------------------------------- */
const isValidContentType = (v) =>
  typeof v === 'string' && /^[^\/\s]+\/[^;\s]+(\s*;.*)?$/i.test(v);

const isM3U8Type = (ct) =>
  /application\/(vnd\.apple\.mpegurl|x-mpegurl)/i.test(ct || '');

/* ------------------------------ Middleware ---------------------------- */
app.use(cors());
app.use(rateLimit({ windowMs: 60_000, max: 200 }));

app.get('/', (_req, res) => res.status(200).type('text/plain').send('HLS proxy OK'));
app.get('/health', (_req, res) => res.status(200).json({ ok: true }));

/* -------------------------------- /hls -------------------------------- */
app.get('/hls', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).type('text/plain').send('Missing url');

    let target;
    try {
      target = new URL(url);
    } catch {
      return res.status(400).type('text/plain').send('Invalid url');
    }

    if (!isAllowedHost(target.hostname)) {
      console.warn(yellow('[proxy] Blocked host:'), target.hostname, '| RELAXED=', ALLOW_RELAXED);
      return res.status(403).type('text/plain').send('Upstream host not allowed');
    }

    target = normalizeTarget(target);
    const isPlaylistPath = target.pathname.endsWith('.m3u8');
    const hdrs = upstreamHeaders(target.hostname, isPlaylistPath, req);

    const cookieStr = getCookies(target.hostname);
    if (cookieStr) hdrs.Cookie = cookieStr;

    if (isPlaylistPath) {
      console.log(cyan('[proxy]'), 'Playlist →', `${target.hostname}${target.pathname}`);
    }

    const upstream = await fetch(target, {
      headers: hdrs,
      redirect: 'follow',
      signal: AbortSignal.timeout(20000),
    });

    // On error: DO NOT reuse upstream content-type (it might be invalid)
    if (!upstream.ok) {
      const body = await upstream.text().catch(() => '');
      console.error(
        red('[proxy] ⇦'),
        upstream.status,
        upstream.statusText,
        '| host=',
        target.hostname,
        '| path=',
        target.pathname,
        body ? `| body: ${body.slice(0, 160)}` : ''
      );
      return res
        .status(upstream.status)
        .type('text/plain')
        .send(body || upstream.statusText);
    }

    // Successful response — now decide/set a safe Content-Type
    const ctypeRaw = upstream.headers.get('content-type') || '';
    const looksM3U8 = isPlaylistPath || isM3U8Type(ctypeRaw);

    res.setHeader('Access-Control-Allow-Origin', '*');

    if (looksM3U8) {
      // Always force a clean, valid m3u8 content type
      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      const text = await upstream.text();
      const proxyOrigin = `${req.protocol}://${req.get('host')}`;
      const rewritten = rewritePlaylist(text, target, proxyOrigin);
      console.log(green('[proxy] ✔ Playlist OK'), 'from', target.hostname);
      return res.status(200).send(rewritten);
    }

    // Non-playlist. Use upstream type only if it parses as valid media type.
    if (isValidContentType(ctypeRaw)) {
      res.setHeader('Content-Type', ctypeRaw);
    } else {
      res.setHeader('Content-Type', 'application/octet-stream');
    }

    if (upstream.body) {
      res.status(200);
      pipeline(
        Readable.fromWeb(upstream.body),
        res,
        (err) => {
          if (err) {
            console.error(red('[proxy] pipe error:'), err?.message || err);
            if (!res.headersSent) res.status(502);
            try { res.end(); } catch {}
          }
        }
      );
      return;
    }

    res.status(204).end();
  } catch (e) {
    console.error(red('[proxy] error:'), e?.stack || e);
    if (!res.headersSent) res.status(502).type('text/plain').send('Proxy upstream error');
  }
});

/* ---------------------------- Start server ---------------------------- */
const server = app.listen(PORT, () => {
  console.log(`HLS proxy running on http://localhost:${PORT} | ALLOW_RELAXED=${ALLOW_RELAXED}`);
});

server.on('error', (err) => {
  console.error(red('[proxy] server error:'), err?.stack || err);
  process.exit(1);
});
process.on('uncaughtException', (err) => {
  console.error(red('[proxy] uncaughtException:'), err?.stack || err);
});
process.on('unhandledRejection', (reason) => {
  console.error(red('[proxy] unhandledRejection:'), reason);
});
