import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/analyze': 'http://localhost:8000',
      '/auth': 'http://localhost:3001',
      '/judge0': {
        target: 'https://ce.judge0.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/judge0/, ''),
      },
    },
  },
})
