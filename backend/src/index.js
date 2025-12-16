/**
 * Main Application Entry Point
 * Combines all routes and middleware
 */

import { Hono } from 'hono';
import { apiCors } from './middleware/cors.js';

// Import route modules
import healthRoutes from './routes/health.js';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import rssRoutes from './routes/rss.js';
import chatRoutes from './routes/chat.js';
import imageRoutes from './routes/image.js';
import staticRoutes from './routes/static.js';
// Note: Gemini Live WebSocket is handled directly in worker.js

// Initialize state (seeds demo users)
import './state.js';

// Create main app
const app = new Hono();

// ============================================
// CORS Middleware
// ============================================
app.use('/api/*', apiCors);

// ============================================
// Mount Route Modules
// ============================================

// Health & Models
app.route('/api', healthRoutes);

// Authentication
app.route('/api/auth', authRoutes);

// Admin
app.route('/api/admin', adminRoutes);

// RSS Feeds
app.route('/api/rss', rssRoutes);

// Chat Completions (OpenAI compatible)
app.route('/api/v1', chatRoutes);

// Image Generation
app.route('/api/image', imageRoutes);

// Note: Gemini Live WebSocket (/api/v1/live) is handled in worker.js

// Static Assets & SPA Fallback (must be last)
app.route('', staticRoutes);

export default app;
