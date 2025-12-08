// src/lib/proxy.ts
// Single source of truth for the proxy base (works in dev + Vercel)
export const PROXY: string =
  (import.meta as any)?.env?.VITE_HLS_PROXY || '/api/hls?url=';

export const viaProxy = (u: string) => `${PROXY}${encodeURIComponent(u)}`;

console.log('[HLS] PROXY =', PROXY);
