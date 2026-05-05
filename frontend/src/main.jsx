import React from 'react';
import ReactDOM from 'react-dom/client';
import AppWithAuth from './App';
import './index.css';
import { testSystemPrompt } from './prompts/test-system-prompt'; // Import test for console access
import './_globalStyles.css';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

const STALE_ASSET_RELOAD_KEY = 'sculptor:last-stale-asset-reload';

const isBuildAssetUrl = (url) => (
  typeof url === 'string' &&
  url.includes('/assets/') &&
  /\.(?:js|mjs|css|wasm)(?:\?|$)/i.test(url)
);

const clearAppCaches = async () => {
  if (!('caches' in window)) {
    return;
  }

  const cacheNames = await window.caches.keys();
  await Promise.all(
    cacheNames
      .filter((cacheName) => cacheName.startsWith('ai-portal-'))
      .map((cacheName) => window.caches.delete(cacheName))
  );
};

const reloadForFreshBuildAssets = async () => {
  const previousReload = Number(sessionStorage.getItem(STALE_ASSET_RELOAD_KEY) || 0);

  if (Date.now() - previousReload < 60000) {
    return;
  }

  sessionStorage.setItem(STALE_ASSET_RELOAD_KEY, String(Date.now()));

  try {
    await clearAppCaches();
  } finally {
    window.location.reload();
  }
};

window.addEventListener('error', (event) => {
  const target = event.target;
  const assetUrl = target?.src || target?.href || '';
  const message = event.message || '';

  if (
    isBuildAssetUrl(assetUrl) ||
    /Failed to load module script|Expected a JavaScript-or-Wasm module script/i.test(message)
  ) {
    reloadForFreshBuildAssets();
  }
}, true);

window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;
  const message = typeof reason === 'string' ? reason : reason?.message || '';

  if (/Failed to fetch dynamically imported module|Importing a module script failed/i.test(message)) {
    reloadForFreshBuildAssets();
  }
});

// Make test available in console
window.testSculptorAI = testSystemPrompt;

// Define the router configuration using the modern createBrowserRouter
const router = createBrowserRouter(
  [
    {
      path: "/*",
      element: <AppWithAuth />,
    },
  ],
  {
    future: {
      // Opt-in to React Router v7 data APIs
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    },
  }
);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
