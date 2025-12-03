// proxy.js
const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const { URL } = require('url');

const app = express();
const PORT = process.env.PROXY_PORT || 5174;

// ---- CORS (frontend on another port) ----
app.use(cors({ origin: true }));
app.options('*', cors());

// ---- optional: host allowlist for safety ----
const ALLOW = new Set([
  // News you’re using:
  'live-hls-web-aje.getaj.net',           // Al Jazeera
  'akamaized.net',                        // many CDNs (DW/RedBull/NASA/etc.)
  'static.france24.com',                  // France 24
  'd2e1asnsl7br7b.cloudfront.net',        // CNA
  'euronews-euronews-english-1-gb.samsung.wurl.com',
  'nhkworld.webcdn.stream.ne.jp',
  'tv-trtworld.live.trt.com.tr',
  'news.cgtn.com',
  'player-tvcultura.stream.uol.com.br',
  'rockzillatv.rocks',
  'stream.nstg.tv',
  'pets-tv.live.stream.geo.akamaized.net',
  'fash1043.cloudycdn.services',
  'dai.google.com',
  'rbmn-live.akamaized.net',
  'ntv1.akamaized.net',
]);

function isAllowed(hostname) {
  const h = hostname.replace(/^www\./, '').toLowerCase();
  if (ALLOW.has(h)) return true;
  // allow subdomains of any base in ALLOW
  for (const base of ALLOW) {
    if (h === base) return true;
    if (h.endsWith('.' + base)) return true;
  }
  return false;
}

// per-host referer/origin hints (some CDNs check this)
function refererFor(hostname) {
  if (hostname.includes('getaj.net')) {
    return { Referer: 'https://www.aljazeera.com/live/', Origin: 'https://www.aljazeera.com' };
  }
  if (hostname.includes('france24.com')) {
    return { Referer: 'https://www.france24.com/', Origin: 'https://www.france24.com' };
  }
  if (hostname.includes('akamaized.net')) {
    // usually fine without referer; provide a neutral one
    return { Referer: 'https://example.com', Origin: 'https://example.com' };
  }
  if (hostname.includes('cloudfront.net')) {
    return { Referer: 'https://www.channelnewsasia.com/', Origin: 'https://www.channelnewsasia.com' };
  }
  return { Referer: 'https://example.com', Origin: 'https://example.com' };
}

// Unified endpoint: support both /proxy?url=... and /hls?url=...
async function handleProxy(req, res) {
  const targetUrl = req.query.url;
  if (!targetUrl) return res.status(400).send('Missing url parameter');

  let parsed;
  try {
    parsed = new URL(targetUrl);
    if (!/^https?:$/.test(parsed.protocol)) {
      return res.status(400).send('Only http/https are allowed');
    }
  } catch {
    return res.status(400).send('Invalid url parameter');
  }

  if (!isAllowed(parsed.hostname)) {
    return res.status(403).send(`[proxy] host not allowed: ${parsed.hostname}`);
  }

  console.log(`[proxy] ${req.method} → ${parsed.toString()}`);

  try {
    const extra = refererFor(parsed.hostname);
    const upstream = await fetch(parsed.toString(), {
      method: 'GET',
      // HLS/CDN-friendly headers
      headers: {
        'Accept': 'application/vnd.apple.mpegurl,application/x-mpegURL,video/*,*/*',
        'User-Agent':
          req.headers['user-agent'] ||
          'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome Safari',
        ...(req.headers.range ? { Range: req.headers.range } : {}),
        ...extra,
      },
    });

    // bubble status
    res.status(upstream.status);

    // permissive CORS back to UI
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Type,Content-Length,Accept-Ranges');

    // pass along useful headers
    const ctype = upstream.headers.get('content-type');
    if (ctype) res.setHeader('Content-Type', ctype);
    const clen = upstream.headers.get('content-length');
    if (clen) res.setHeader('Content-Length', clen);
    const ranges = upstream.headers.get('accept-ranges');
    if (ranges) res.setHeader('Accept-Ranges', ranges);
    const cache = upstream.headers.get('cache-control');
    if (cache) res.setHeader('Cache-Control', cache);

    // stream body
    if (!upstream.body) return res.end();
    upstream.body.pipe(res);
  } catch (err) {
    console.error(`[proxy] error: ${err.message}`);
    res.status(502).send('proxy fetch failed');
  }
}

app.get('/proxy', handleProxy);
app.get('/hls', handleProxy); // compatibility with existing /hls?url=...

app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
});
