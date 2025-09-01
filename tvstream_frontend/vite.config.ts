// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      // All HLS traffic → Node proxy
      '/hls': {
        target: 'http://localhost:5174',
        changeOrigin: true,
        rewrite: (p) => p, // keep /hls?url=...
      },
    },
  },
})
