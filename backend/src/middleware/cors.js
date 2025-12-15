/**
 * CORS Middleware Configuration
 */

import { cors } from 'hono/cors';

/**
 * API CORS middleware configuration
 */
export const apiCors = cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'x-api-key']
});

