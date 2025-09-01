// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      // Existing CGTN setup (unchanged)
      '/cgtn': {
        target: 'https://live.cgtn.com',
        changeOrigin: true,
        secure: true,
        headers: {
          Referer: 'https://www.cgtn.com/',
          Origin: 'https://www.cgtn.com',
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        rewrite: (p) => p.replace(/^\/cgtn/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('Referer', 'https://www.cgtn.com/');
            proxyReq.setHeader('Origin', 'https://www.cgtn.com');
            proxyReq.setHeader(
              'User-Agent',
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'
            );
          });
          proxy.on('error', (err, _req, res) => {
            console.error('[vite-proxy] CGTN error:', err?.message || err);
            try {
              res.writeHead(502, { 'Content-Type': 'text/plain' });
              res.end('Proxy error');
            } catch {}
          });
        },
      },

      // Generic HLS proxy → your Node hls-proxy.mjs server
      '/hls': {
        target: 'http://localhost:5174',
        changeOrigin: true,
        // do not rewrite path or strip query
        rewrite: (p) => p,
        configure: (proxy) => {
          proxy.on('error', (err, _req, res) => {
            console.error('[vite-proxy] HLS error:', err?.message || err);
            try {
              res.writeHead(502, { 'Content-Type': 'text/plain' });
              res.end('HLS proxy error');
            } catch {}
          });
        },
      },
    },
  },
})
