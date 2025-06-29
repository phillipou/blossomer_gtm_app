import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy API requests to FastAPI backend in development
      '/auth': 'http://localhost:8000',
      '/company': 'http://localhost:8000',
      '/customers': 'http://localhost:8000',
      '/campaigns': 'http://localhost:8000',
      // Add more as needed
    },
  },
})
