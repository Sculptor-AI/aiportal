import express from 'express';
import { completeChat } from '../controllers/chatController.js';
import { getModels } from '../controllers/modelController.js';
import { validateChatRequest } from '../middleware/validation.js';

const router = express.Router();

// Get available models
router.get('/models', getModels);

// Chat completion endpoint
router.post('/chat', validateChatRequest, completeChat);

export { router }; 