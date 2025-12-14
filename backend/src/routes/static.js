/**
 * Static Assets & SPA Fallback Routes
 */

import { Hono } from 'hono';

const staticRoutes = new Hono();

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
      return await env.ASSETS.fetch(c.req.raw);
    } catch (e) {
      return c.json({ error: 'Asset not found' }, 404);
    }
  }

  // For all other requests, serve index.html to handle client-side routing
  try {
    return await env.ASSETS.fetch(`${url.origin}/index.html`);
  } catch (e) {
    return c.text('Frontend not deployed. API endpoints are available at /api/*', 200);
  }
});

export default staticRoutes;
