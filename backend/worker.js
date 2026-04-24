/**
 * Cloudflare Worker Entry Point
 *
 * This file serves as the entry point for the Cloudflare Worker.
 * All application logic is organized in the src/ directory.
 *
 * File Structure:
 * - src/index.js         - Main app with route mounting
 * - src/middleware/      - Middleware (CORS, auth)
 * - src/routes/          - Route handlers
 *   - health.js          - Health check & models
 *   - auth.js            - User authentication
 *   - admin.js           - Admin APIs
 *   - rss.js             - RSS feed routes
 *   - chat.js            - Chat completions
 *   - image.js           - Image generation
 *   - video.js           - Video generation
 *   - static.js          - Static assets & SPA
 * - src/services/        - Business logic services
 *   - gemini.js          - Gemini API handling
 * - src/utils/           - Utility functions
 *   - helpers.js         - Common helpers
 *   - auth.js            - Auth utilities
 *   - crypto.js          - Cryptographic utilities
 */

import app from './src/index.js';

const applySecurityHeaders = (response, requestUrl) => {
  const headers = new Headers(response.headers);

  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('Referrer-Policy', 'no-referrer');
  headers.set('Permissions-Policy', 'camera=(self), microphone=(self), display-capture=(self), on-device-speech-recognition=(self), geolocation=()');

  if (requestUrl.protocol === 'https:') {
    headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Pass all other requests to Hono app
    const response = await app.fetch(request, env, ctx);
    return applySecurityHeaders(response, url);
  }
};
