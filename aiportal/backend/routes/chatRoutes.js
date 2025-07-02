import express from 'express';
import { chatCompletions } from '../controllers/chatCompletionController.js';

const router = express.Router();

router.post('/completions', chatCompletions);

export default router; 