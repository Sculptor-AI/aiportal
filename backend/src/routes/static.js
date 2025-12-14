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

  // Check if this is a request for a static asset
  if (url.pathname.startsWith('/assets/') ||
    url.pathname.startsWith('/images/') ||
    url.pathname.includes('.')) {
    return env.ASSETS.fetch(c.req.raw);
  }

  // For all other requests, serve index.html to handle client-side routing
  if (env.ASSETS) {
    return env.ASSETS.fetch(`${url.origin}/index.html`);
  }
  return c.text('Backend is running. API endpoints are available at /api/*', 200);
});

export default staticRoutes;

