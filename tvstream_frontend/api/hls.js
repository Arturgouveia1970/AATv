// tvstream_frontend/api/hls.js
import { Readable } from 'stream';

const UA =
  process.env.USER_AGENT ||
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36';

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Range,User-Agent,Referer,Origin');
  res.setHeader('Access-Control-Expose-Headers', '*');
}

const HOST_HEADERS = {
  // Al Jazeera
  'live-hls-aje-ak.getaj.net': { Referer: 'https://www.aljazeera.com/' },
  'live-hls-web-aje.getaj.net': { Referer: 'https://www.aljazeera.com/' },

  // CGTN (example)
  'live.cgtn.com': { Referer: 'https://www.cgtn.com', Origin: 'https://www.cgtn.com' },
};

function extraHeadersFor(u) {
  for (const host in HOST_HEADERS) {
    if (u.hostname.endsWith(host)) return HOST_HEADERS[host];
  }
  return {};
}

function proxify(absUrl, req) {
  const origin = `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}`;
  return `${origin}/api/hls?url=${encodeURIComponent(absUrl)}`;
}

function rewritePlaylist(text, baseUrl, req) {
  const base = typeof baseUrl === 'string' ? new URL(baseUrl) : baseUrl;

  const rewriteAttrUris = (line) =>
    line.replace(/URI="([^"]+)"/g, (_m, uri) => {
      const abs = new URL(uri, base).toString();
      return `URI="${proxify(abs, req)}"`;
    });

  return text
    .split('\n')
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return line;
      if (trimmed.startsWith('#')) {
        return trimmed.includes('URI="') ? rewriteAttrUris(line) : line;
      }
      const abs = new URL(trimmed, base).toString();
      return proxify(abs, req);
    })
    .join('\n');
}

const isM3U8CT = (ct) => /application\/(vnd\.apple\.mpegurl|x-mpegurl)/i.test(ct || '');

export default async function handler(req, res) {
  try {
    setCors(res);

    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }

    const raw = (req.query?.url ?? req.url?.split('?url=')[1]) || '';
    if (!raw) {
      res.status(400).send('Missing url');
      return;
    }

    const decoded = decodeURIComponent(raw);
    const u = new URL(decoded);

    const headers = {
      'User-Agent': UA,
      ...(req.headers.range ? { Range: req.headers.range } : {}),
      ...extraHeadersFor(u),
    };

    const upstream = await fetch(u.toString(), { headers, redirect: 'follow' });

    if (!upstream.ok) {
      const body = await upstream.text().catch(() => '');
      res.status(upstream.status).type('text/plain').send(body || upstream.statusText);
      return;
    }

    const ct = upstream.headers.get('content-type') || '';
    const looksM3U8 = isM3U8CT(ct) || u.pathname.endsWith('.m3u8');

    // Always allow cross-origin
    res.setHeader('Access-Control-Allow-Origin', '*');

    if (looksM3U8) {
      const text = await upstream.text();
      const rewritten = rewritePlaylist(text, u, req);
      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      res.status(200).send(rewritten);
      return;
    }

    // Non-playlist (segments, keys, etc.): pass through content-type if valid
    if (ct) res.setHeader('Content-Type', ct);

    if (req.method === 'HEAD' || !upstream.body) {
      res.status(200).end();
      return;
    }

    const nodeStream = Readable.fromWeb(upstream.body);
    nodeStream.on('error', () => {
      try { res.end(); } catch {}
    });
    res.status(200);
    nodeStream.pipe(res);
  } catch (e) {
    console.error('[api/hls] error', e);
    try {
      setCors(res);
      res.status(502).type('text/plain').send('Bad gateway');
    } catch {}
  }
}
