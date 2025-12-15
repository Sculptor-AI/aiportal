import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3009,
    headers: {
      'Content-Security-Policy': [
        "default-src 'self' https://73.118.140.130:3000;",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval';",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;",
        "img-src 'self' data: blob: https://*.googleusercontent.com https://images.unsplash.com https://image.pollinations.ai https://loremflickr.com https://picsum.photos;",
        "font-src 'self' data: https://fonts.gstatic.com;",
        "connect-src 'self' ws://localhost:* wss://localhost:* http://localhost:8787 http://127.0.0.1:8787 wss://73.118.140.130:3000 https://73.118.140.130 https://generativelanguage.googleapis.com https://api.anthropic.com https://api.openai.com https://integrate.api.nvidia.com https://api.sculptorai.org/ wss://api.sculptorai.org https://ai.kaileh.dev wss://ai.kaileh.dev https://fonts.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://www.googleapis.com https://purgpt.xyz https://*.google.com https://accounts.google.com https://73.118.140.130:3000 https://api.rss2json.com https://api.allorigins.win;",
        "object-src 'none';",
        "frame-src 'self' https://accounts.google.com;",
        "frame-ancestors 'none';",
        "base-uri 'self';",
        "form-action 'self';"
      ].join(' ')
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
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