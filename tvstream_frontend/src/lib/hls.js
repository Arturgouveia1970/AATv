// tvstream_frontend/src/lib/hls.js

const HLS_PROXY = import.meta.env?.VITE_HLS_PROXY || '/api/hls?url='

/** Is this an HLS URL (.m3u8)? */
export const isHls = (u) =>
  typeof u === 'string' && u.toLowerCase().includes('.m3u8')

/** Has this URL already been wrapped by our proxy? */
export const alreadyProxied = (u) =>
  typeof u === 'string' &&
  (/^\/api\/hls(\?|$)/.test(u) || /^\/hls\?url=/.test(u))

/** Wrap a raw absolute URL with the proxy endpoint */
export const withApiProxy = (absoluteUrl) =>
  `${HLS_PROXY}${encodeURIComponent(absoluteUrl)}`
