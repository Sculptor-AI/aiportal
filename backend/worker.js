/**
 * Cloudflare Worker Entry Point
 * 
 * This file serves as the entry point for the Cloudflare Worker.
 * All application logic is organized in the src/ directory.
 * 
 * File Structure:
 * - src/index.js         - Main app with route mounting
 * - src/state.js         - In-memory state management
 * - src/middleware/      - Middleware (CORS, etc.)
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
 *   - rss.js             - RSS feed parsing
 * - src/utils/           - Utility functions
 *   - helpers.js         - Common helpers
 *   - auth.js            - Auth utilities
 */

import app from './src/index.js';

export default app;
