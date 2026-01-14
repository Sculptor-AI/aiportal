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
import { validateToken } from './src/middleware/auth.js';

const GEMINI_LIVE_WS_URL = 'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent';

/**
 * Handle WebSocket upgrade for Gemini Live
 * Uses fetch() with Upgrade header for Cloudflare Workers compatibility
 */
async function handleGeminiLiveWebSocket(request, env) {
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response('Gemini API key not configured', { status: 500 });
  }

  // Create WebSocket pair for client connection
  const webSocketPair = new WebSocketPair();
  const [client, server] = Object.values(webSocketPair);

  // Accept the server side of the WebSocket
  server.accept();

  // Connect to Gemini using fetch with WebSocket upgrade
  const geminiUrl = `${GEMINI_LIVE_WS_URL}?key=${apiKey}`;

  let geminiWs = null;
  let messageQueue = [];

  // Function to connect to Gemini
  const connectToGemini = async () => {
    try {
      console.log('[GeminiLive] Connecting to Gemini API...');

      // Use fetch with Upgrade header for Cloudflare Workers
      const geminiResponse = await fetch(geminiUrl, {
        headers: {
          'Upgrade': 'websocket',
        },
      });

      if (geminiResponse.status !== 101) {
        throw new Error(`Failed to upgrade: ${geminiResponse.status} ${geminiResponse.statusText}`);
      }

      geminiWs = geminiResponse.webSocket;
      if (!geminiWs) {
        throw new Error('No WebSocket in response');
      }

      geminiWs.accept();
      console.log('[GeminiLive] Connected to Gemini API');

      // Send any queued messages
      while (messageQueue.length > 0) {
        const msg = messageQueue.shift();
        geminiWs.send(msg);
      }

      // Forward messages from Gemini to client
      geminiWs.addEventListener('message', (event) => {
        if (server.readyState === WebSocket.OPEN) {
          server.send(event.data);
        }
      });

      geminiWs.addEventListener('close', (event) => {
        console.log('[GeminiLive] Gemini closed:', event.code, event.reason);
        if (server.readyState === WebSocket.OPEN) {
          server.send(JSON.stringify({
            connectionClosed: {
              code: event.code,
              reason: event.reason || 'Gemini connection closed'
            }
          }));
        }
      });

      geminiWs.addEventListener('error', (error) => {
        console.error('[GeminiLive] Gemini error:', error);
        if (server.readyState === WebSocket.OPEN) {
          server.send(JSON.stringify({
            error: { message: 'Gemini WebSocket error' }
          }));
        }
      });

    } catch (error) {
      console.error('[GeminiLive] Connection error:', error);
      if (server.readyState === WebSocket.OPEN) {
        server.send(JSON.stringify({
          error: { message: `Failed to connect to Gemini: ${error.message}` }
        }));
      }
    }
  };

  // Connect to Gemini immediately
  await connectToGemini();

  // Handle messages from client
  server.addEventListener('message', (event) => {
    if (geminiWs && geminiWs.readyState === WebSocket.OPEN) {
      geminiWs.send(event.data);
    } else {
      // Queue message if not connected yet
      messageQueue.push(event.data);
    }
  });

  // Handle client disconnect
  server.addEventListener('close', (event) => {
    console.log('[GeminiLive] Client disconnected:', event.code);
    if (geminiWs && geminiWs.readyState === WebSocket.OPEN) {
      geminiWs.close(1000, 'Client disconnected');
    }
  });

  server.addEventListener('error', (error) => {
    console.error('[GeminiLive] Client error:', error);
    if (geminiWs && geminiWs.readyState === WebSocket.OPEN) {
      geminiWs.close(1011, 'Client error');
    }
  });

  // Return WebSocket upgrade response to client
  return new Response(null, {
    status: 101,
    webSocket: client,
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Handle WebSocket upgrade for Gemini Live (production only)
    if (url.pathname === '/api/v1/live') {
      const upgradeHeader = request.headers.get('Upgrade');
      if (upgradeHeader && upgradeHeader.toLowerCase() === 'websocket') {
        // Authenticate the WebSocket request
        // Prefer Authorization header (more secure) over query parameter
        // Query param is supported for WebSocket clients that can't set headers
        const token = request.headers.get('Authorization')?.replace('Bearer ', '') ||
                      url.searchParams.get('token');

        if (!token) {
          return new Response(JSON.stringify({ error: 'Authentication required' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        // Validate the token
        const user = await validateToken(env.KV, token);
        if (!user) {
          return new Response(JSON.stringify({ error: 'Invalid or expired session' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        // WebSocket proxy only works in production Cloudflare Workers
        return handleGeminiLiveWebSocket(request, env);
      }

      // Non-WebSocket request - return status (but don't expose if not authenticated)
      const token = request.headers.get('Authorization')?.replace('Bearer ', '');
      if (!token) {
        return new Response(JSON.stringify({ error: 'Authentication required' }), {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          }
        });
      }

      const user = await validateToken(env.KV, token);
      if (!user) {
        return new Response(JSON.stringify({ error: 'Invalid or expired session' }), {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          }
        });
      }

      return new Response(JSON.stringify({
        available: !!env.GEMINI_API_KEY,
        endpoint: '/api/v1/live',
        hint: 'Connect via WebSocket with token query param to use Gemini Live'
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      });
    }

    // SECURITY FIX: The /api/v1/live/config endpoint was removed because it exposed
    // the Gemini API key to clients. This comment is retained to prevent accidental
    // re-introduction. Clients must use the authenticated WebSocket proxy at /api/v1/live
    // which keeps the API key secure on the server side.

    // Pass all other requests to Hono app
    return app.fetch(request, env, ctx);
  }
};
