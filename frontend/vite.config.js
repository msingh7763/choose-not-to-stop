import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const API_PROXY_TARGET = process.env.VITE_DEV_API_PROXY_TARGET || 'http://localhost:5001';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: API_PROXY_TARGET,
        changeOrigin: true,
      },
    },
  },
});

