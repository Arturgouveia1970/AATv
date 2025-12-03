// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      injectRegister: 'auto',
      registerType: 'autoUpdate',
      includeAssets: [
        'icons/AATv_icons/AATv_192x192.png',
        'icons/AATv_icons/AATv_512x512.png'
      ],
      manifest: {
        name: 'AATv',
        short_name: 'AATv',
        description: 'Lightweight live TV streaming.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#0f172a',
        theme_color: '#0f172a',
        icons: [
          { src: 'icons/AATv_icons/AATv_192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: 'icons/AATv_icons/AATv_512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // Don’t cache HLS; force network.
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.endsWith('.m3u8') || url.pathname.endsWith('.ts'),
            handler: 'NetworkOnly'
          }
        ]
      }
    })
  ],
  server: {
    port: 3000,
    strictPort: true,
    // If you want HTTPS in dev (optional):
    // https: true,
    proxy: {
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
            proxyReq.setHeader('Referer', 'https://www.cgtn.com/')
            proxyReq.setHeader('Origin', 'https://www.cgtn.com')
            proxyReq.setHeader(
              'User-Agent',
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'
            )
          })
          proxy.on('error', (err, _req, res) => {
            console.error('[vite-proxy] CGTN error:', err?.message || err)
            try {
              res.writeHead(502, { 'Content-Type': 'text/plain' })
              res.end('Proxy error')
            } catch {}
          })
        }
      },

      // HLS proxy → your node server at 5174
      '/hls': {
        target: 'http://localhost:5174',
        changeOrigin: true,
        rewrite: (p) => p, // keep query string intact
        configure: (proxy) => {
          proxy.on('error', (err, _req, res) => {
            console.error('[vite-proxy] HLS error:', err?.message || err)
            try {
              res.writeHead(502, { 'Content-Type': 'text/plain' })
              res.end('HLS proxy error')
            } catch {}
          })
        }
      }
    }
  }
})
