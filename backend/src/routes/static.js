/**
 * Static Assets & SPA Fallback Routes
 */

import { Hono } from 'hono';

const staticRoutes = new Hono();

const NO_CACHE_HEADERS = 'no-cache, no-store, must-revalidate';

const withCacheControl = (response, cacheControl) => {
  const headers = new Headers(response.headers);
  headers.set('Cache-Control', cacheControl);

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
};

/**
 * Handle static assets and SPA fallback
 */
staticRoutes.get('*', async (c) => {
  const url = new URL(c.req.url);
  const env = c.env;

  // Check if ASSETS binding is available (only in production/Pages)
  if (!env.ASSETS) {
    // In local dev without assets, return API info for root
    if (url.pathname === '/') {
      return c.text('Backend is running. API endpoints are available at /api/*', 200);
    }
    // Return 404 for other paths
    return c.json({ error: 'Not found', path: url.pathname }, 404);
  }

  // Check if this is a request for a static asset
  if (url.pathname.startsWith('/assets/') ||
    url.pathname.startsWith('/images/') ||
    url.pathname.includes('.')) {
    try {
      const assetResponse = await env.ASSETS.fetch(c.req.raw);

      if (url.pathname === '/sw.js' || url.pathname === '/index.html') {
        return withCacheControl(assetResponse, NO_CACHE_HEADERS);
      }

      return assetResponse;
    } catch (e) {
      return c.json({ error: 'Asset not found' }, 404);
    }
  }

  // For all other requests, serve index.html to handle client-side routing
  try {
    const appShellResponse = await env.ASSETS.fetch(`${url.origin}/index.html`);
    return withCacheControl(appShellResponse, NO_CACHE_HEADERS);
  } catch (e) {
    return c.text('Frontend not deployed. API endpoints are available at /api/*', 200);
  }
});

export default staticRoutes;
