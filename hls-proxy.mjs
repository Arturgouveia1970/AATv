// hls-proxy.mjs
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream';
import process from 'node:process';

const app = express();
const PORT = process.env.PORT || 5174;

// Relaxed allowlist for debugging: HLS_ALLOW_RELAXED=true
const ALLOW_RELAXED = String(process.env.HLS_ALLOW_RELAXED || 'false').toLowerCase() === 'true';

// --- tiny helpers for colored logs
const cyan = (s) => `\x1b[36m${s}\x1b[0m`;
const green = (s) => `\x1b[32m${s}\x1b[0m`;
const yellow = (s) => `\x1b[33m${s}\x1b[0m`;
const red = (s) => `\x1b[31m${s}\x1b[0m`;

/** -------------------- Upstreams + optional headers -------------------- **/
const HOST_CONFIG = {
  // Al Jazeera (needs a Referer sometimes)
  'live-hls-web-aje.getaj.net': { referer: 'https://www.aljazeera.com/' },

  // DW
  'dwamdstream102.akamaized.net': {},
  'dwamdstream101.akamaized.net': {},

  // CNA
  'd2e1asnsl7br7b.cloudfront.net': {},

  // Red Bull TV
  'rbmn-live.akamaized.net': {},
};

const ALLOW_HOSTS = new Set(Object.keys(HOST_CONFIG));

/** ------------------------- Tiny in-memory cookie jar ------------------------- **/
const COOKIE_JAR = new Map();   // hostname -> "k=v; k2=v2"
const COOKIE_TIME = new Map();  // hostname -> lastSetTime (ms)
const COOKIE_TTL_MS = 60 * 60 * 1000; // 1h

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

/** ------------------------------ Allowlist logic ------------------------------ **/
function isAllowedHost(hostname) {
  if (ALLOW_HOSTS.has(hostname)) return true;

  // Relaxed mode: allow common CDNs (debugging/wider coverage)
  if (ALLOW_RELAXED) {
    if (
      hostname.endsWith('.akamaized.net') ||
      hostname.endsWith('.cloudfront.net')
    ) return true;
  }

  return false;
}

/** ------------------------- Request header selection ------------------------- **/
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

/** ------------------------- Minor target normalization ------------------------ **/
function normalizeTarget(u) {
  const h = u.hostname;
  if (h.endsWith('.akamaized.net') && u.protocol === 'http:') {
    return new URL(u.toString().replace(/^http:/, 'https:'));
  }
  return u;
}

function proxify(absUrl, proxyOrigin) {
  return `${proxyOrigin}/hls?url=${encodeURIComponent(absUrl)}`;
}

/** ----------------------- Playlist URL rewriting (M3U8) ---------------------- **/
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

/** ------------------------------- Middleware -------------------------------- **/
app.use(cors());
app.use(rateLimit({ windowMs: 60_000, max: 200 }));

app.get('/', (_req, res) => res.status(200).send('HLS proxy OK'));
app.get('/health', (_req, res) => res.status(200).json({ ok: true }));

/** ---------------------------------- /hls ----------------------------------- **/
app.get('/hls', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).send('Missing url');

    let target;
    try {
      target = new URL(url);
    } catch {
      return res.status(400).send('Invalid url');
    }

    if (!isAllowedHost(target.hostname)) {
      console.warn(yellow('[proxy] Blocked host:'), target.hostname, '| RELAXED=', ALLOW_RELAXED);
      return res.status(403).send('Upstream host not allowed');
    }

    target = normalizeTarget(target);
    const isPlaylist = target.pathname.endsWith('.m3u8');

    const hdrs = upstreamHeaders(target.hostname, isPlaylist, req);

    // attach cookies, if any
    const cookieStr = getCookies(target.hostname);
    if (cookieStr) hdrs.Cookie = cookieStr;

    // log playlists only (segments are noisy)
    if (isPlaylist) {
      console.log(cyan('[proxy]'), 'Playlist →', `${target.hostname}${target.pathname}`);
    }

    const upstream = await fetch(target, {
      headers: hdrs,
      redirect: 'follow',
      signal: AbortSignal.timeout(20000),
    });

    const ctype = (upstream.headers.get('content-type') || '').toLowerCase();
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (ctype) res.setHeader('Content-Type', ctype);

    const setCookie = upstream.headers.get('set-cookie');
    if (setCookie) setCookies(target.hostname, setCookie);

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
      return res.status(upstream.status).send(body || upstream.statusText);
    }

    // Playlist → rewrite to proxy all inner URIs
    if (ctype.includes('mpegurl') || target.pathname.endsWith('.m3u8')) {
      const text = await upstream.text();
      const proxyOrigin = `${req.protocol}://${req.get('host')}`;
      const rewritten = rewritePlaylist(text, target, proxyOrigin);
      console.log(green('[proxy] ✔ Playlist OK'), 'from', target.hostname);
      return res.status(200).send(rewritten);
    }

    // Media segment or other binary → stream with zero buffering
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
      return; // important: don't fall through
    }

    // Fallback (no body – unusual)
    res.status(204).end();
  } catch (e) {
    console.error(red('[proxy] error:'), e?.stack || e);
    if (!res.headersSent) res.status(502).send('Proxy upstream error');
  }
});

/** ----------------------------- Start the server ---------------------------- **/
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
