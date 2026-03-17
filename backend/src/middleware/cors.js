/**
 * CORS Middleware Configuration
 */

import { cors } from 'hono/cors';

const DEFAULT_ALLOWED_ORIGINS = [
  'https://sculptorai.org',
  'https://www.sculptorai.org',
  'https://ai.sculptorai.org',
  'https://api.sculptorai.org',
  'http://localhost:3000',
  'http://localhost:3009',
  'http://localhost:5173',
  'https://localhost:3000',
  'https://localhost:3009',
  'https://localhost:5173'
];

export const parseAllowedOrigins = (rawOrigins) => {
  if (!rawOrigins || typeof rawOrigins !== 'string') {
    return DEFAULT_ALLOWED_ORIGINS;
  }

  const parsed = rawOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return parsed.length > 0 ? parsed : DEFAULT_ALLOWED_ORIGINS;
};

/**
 * API CORS middleware configuration
 */
export const apiCors = cors({
  origin: (origin, c) => {
    const allowedOrigins = parseAllowedOrigins(c.env?.CORS_ALLOWED_ORIGINS);
    if (!origin) return allowedOrigins[0];
    return allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  },
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'x-api-key'],
  maxAge: 86400
});
