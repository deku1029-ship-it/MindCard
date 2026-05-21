import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    allowedHosts: true,
    proxy: {
      // Bất cứ request nào bắt đầu bằng /api sẽ được đẩy sang cổng 3000
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  }
})
