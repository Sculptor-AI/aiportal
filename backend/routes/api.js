import express from 'express';
import { completeChat, streamChat } from '../controllers/chatController.js';
import { getModels } from '../controllers/modelController.js';
import { searchWeb, scrapeUrl, searchAndProcess } from '../controllers/searchController.js';
import { validateChatRequest, validateSearchRequest, validateScrapeRequest, validateSearchProcessRequest } from '../middleware/validation.js';

const router = express.Router();

// Get available models
router.get('/models', getModels);

// Chat completion endpoint
router.post('/chat', validateChatRequest, completeChat);

// Streaming chat completion endpoint
router.post('/chat/stream', validateChatRequest, streamChat);

// Search endpoints
router.post('/search', validateSearchRequest, searchWeb);
router.post('/scrape', validateScrapeRequest, scrapeUrl);
router.post('/search-process', validateSearchProcessRequest, searchAndProcess);

export { router }; 