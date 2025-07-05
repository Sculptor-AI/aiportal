import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3009,
    headers: {
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https://*.googleusercontent.com https://images.unsplash.com https://image.pollinations.ai https://loremflickr.com https://picsum.photos; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https://73.118.140.130 https://73.118.140.130:3000 https://api.sculptorai.org/ https://fonts.googleapis.com ws://localhost:* wss://localhost:* https://*.google.com https://accounts.google.com https://api.rss2json.com https://api.allorigins.win; object-src 'none'; frame-src 'self' https://accounts.google.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self';"
    },
    proxy: {
      '/api': {
        target: 'https://73.118.140.130:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'styled-components'],
        },
      },
    },
  },
});