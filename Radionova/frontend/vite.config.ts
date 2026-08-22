import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: false,
    proxy: {
      // All /api/v1 routes → FastAPI backend
      '/api': 'http://localhost:8000',
      // Legacy root routes
      '/predict': 'http://localhost:8000',
      '/explain': 'http://localhost:8000',
      '/assistant': 'http://localhost:8000',
      '/report': 'http://localhost:8000',
      '/health': 'http://localhost:8000',
    }
  }
});
