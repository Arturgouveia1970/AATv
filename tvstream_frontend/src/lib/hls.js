// tvstream_frontend/src/lib/hls.js

// Prefer explicit env; otherwise choose based on build mode:
// - Dev (vite): use /hls?url=  → Vite proxy to 5174
// - Prod (Vercel): use /api/hls?url=
const HLS_PROXY =
  (import.meta?.env && import.meta.env.VITE_HLS_PROXY) ||
  (import.meta?.env?.DEV ? '/hls?url=' : '/api/hls?url=');

console.log('[HLS] PROXY base =', HLS_PROXY);

/** Is this an HLS URL (.m3u8)? */
export const isHls = (u) =>
  typeof u === 'string' && u.toLowerCase().includes('.m3u8');

/** Has this URL already been wrapped by our proxy? */
export const alreadyProxied = (u) =>
  typeof u === 'string' &&
  (u.startsWith('/api/hls?url=') || u.startsWith('/hls?url='));

/** Wrap a raw absolute URL with the proxy endpoint (idempotent) */
export const withApiProxy = (absoluteUrl) =>
  alreadyProxied(absoluteUrl)
    ? absoluteUrl
    : `${HLS_PROXY}${encodeURIComponent(absoluteUrl)}`;

/** Alias used by channel data */
export const viaProxy = withApiProxy;
