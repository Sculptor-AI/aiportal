import { Router } from 'itty-router';
import { handleCORS, wrapResponse } from './utils/cors.js';
import { completeChat, streamChat } from './controllers/chatController.js';
import { getModels } from './controllers/modelController.js';
import { searchWeb, scrapeUrl, searchAndProcess } from './controllers/searchController.js';
import { generateImage } from './controllers/imageGenerationController.js';
import { getFeed } from './controllers/rssController.js';

const router = Router();

// Health check
router.get('/health', () => 
  new Response(JSON.stringify({ status: 'OK', message: 'Server is running' }), {
    headers: { 'Content-Type': 'application/json' }
  })
);

// API routes
router.get('/api/models', getModels);
router.post('/api/chat', completeChat);
router.post('/api/chat/stream', streamChat);
router.post('/api/search', searchWeb);
router.post('/api/scrape', scrapeUrl);
router.post('/api/search-process', searchAndProcess);
router.post('/api/v1/images/generate', generateImage);
router.get('/api/rss/feed', getFeed);

// Handle OPTIONS for CORS
router.options('*', handleCORS);

// 404 handler
router.all('*', () => new Response('Not Found', { status: 404 }));

export default {
  async fetch(request, env, ctx) {
    // Add env to request for access in controllers
    request.env = env;
    
    // Route the request
    const response = await router.handle(request, env, ctx)
      .catch(err => new Response(err.message, { status: 500 }));
    
    return wrapResponse(response, request);
  }
};
