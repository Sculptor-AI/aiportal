import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const API_PROXY_TIMEOUT_MS = 10 * 60 * 1000;
const DEFAULT_REMOTE_BACKEND_URL = 'https://api.sculptorai.org';
const DEFAULT_LOCAL_PROXY_TARGET = 'http://localhost:8787';

const cleanBaseUrl = (rawBaseUrl) => {
  let base = (rawBaseUrl || '').trim().replace(/\/+$/, '');

  if (base.endsWith('/api')) {
    base = base.slice(0, -4);
  }

  return base;
};

const toWebSocketUrl = (httpBase) => {
  if (httpBase.startsWith('https://')) {
    return httpBase.replace('https://', 'wss://');
  }

  if (httpBase.startsWith('http://')) {
    return httpBase.replace('http://', 'ws://');
  }

  return httpBase;
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const remoteBackendUrl = cleanBaseUrl(env.VITE_REMOTE_BACKEND_URL || DEFAULT_REMOTE_BACKEND_URL);
  const localProxyTarget = cleanBaseUrl(
    env.VITE_LOCAL_BACKEND_PROXY_TARGET ||
    env.VITE_BACKEND_API_URL ||
    DEFAULT_LOCAL_PROXY_TARGET
  );

  const connectSrc = new Set([
    "'self'",
    'ws://localhost:*',
    'wss://localhost:*',
    'wss://73.118.140.130:3000',
    'https://73.118.140.130',
    'https://generativelanguage.googleapis.com',
    'https://api.anthropic.com',
    'https://api.openai.com',
    'https://integrate.api.nvidia.com',
    'https://ai.kaileh.dev',
    'wss://ai.kaileh.dev',
    'https://fonts.googleapis.com',
    'https://identitytoolkit.googleapis.com',
    'https://securetoken.googleapis.com',
    'https://www.googleapis.com',
    'https://purgpt.xyz',
    'https://*.google.com',
    'https://accounts.google.com',
    'https://73.118.140.130:3000',
    'https://api.rss2json.com',
    'https://api.allorigins.win',
    'https://huggingface.co',
    'https://cdn-lfs.huggingface.co',
    'https://*.xethub.hf.co',
    'https://cdn.jsdelivr.net',
  ]);

  if (remoteBackendUrl) {
    connectSrc.add(remoteBackendUrl);
    connectSrc.add(toWebSocketUrl(remoteBackendUrl));
  }

  if (localProxyTarget) {
    connectSrc.add(localProxyTarget);
    connectSrc.add(toWebSocketUrl(localProxyTarget));
  }

  return {
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
          `connect-src ${Array.from(connectSrc).join(' ')};`,
          "object-src 'none';",
          "frame-src 'self' https://accounts.google.com;",
          "frame-ancestors 'none';",
          "base-uri 'self';",
          "form-action 'self';"
        ].join(' ')
      },
      proxy: {
        '/api': {
          target: localProxyTarget,
          changeOrigin: true,
          secure: false,
          timeout: API_PROXY_TIMEOUT_MS,
          proxyTimeout: API_PROXY_TIMEOUT_MS,
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
  };
});
