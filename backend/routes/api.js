import express from 'express';
import { completeChat, streamChat } from '../controllers/chatController.js';
import { getModels } from '../controllers/modelController.js';
import { searchWeb, scrapeUrl, searchAndProcess } from '../controllers/searchController.js';
import { validateChatRequest, validateSearchRequest, validateScrapeRequest, validateSearchProcessRequest } from '../middleware/validation.js';
import { taskManager } from '../services/deep-research/taskManager.js';
import { getStorageService } from '../services/news/storageService.js';
import { ResponseType } from '../services/deep-research/types.js';

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

// --- Deep Research API Endpoints ---

// Start a research task
router.post('/research/start', async (req, res) => {
  try {
    const { researchTopic } = req.body;
    
    // Validate input
    if (!researchTopic || typeof researchTopic !== 'string') {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'researchTopic is required and must be a string'
      });
    }
    
    // Create secure research request with locked-down configuration
    const researchRequest = {
      researchTopic: researchTopic.trim(),
      responseType: ResponseType.Report,
      autoAgents: true,
      includeCitations: true,
      limitCitationsToThree: true,
      goDeeper: false,
      numAgents: 3
    };
    
    // Create task
    const taskId = taskManager.createTask(researchRequest);
    
    res.json({
      success: true,
      taskId,
      message: 'Research task started successfully'
    });
    
  } catch (error) {
    console.error('Error starting research task:', error);
    
    if (error.message?.includes('Maximum number of concurrent tasks')) {
      return res.status(429).json({
        error: 'Too many requests',
        message: error.message
      });
    }
    
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to start research task'
    });
  }
});

// Get research progress via SSE
router.get('/research/stream/:taskId', (req, res) => {
  const { taskId } = req.params;
  
  // Set up SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });
  
  // Send initial connection message
  res.write('data: {"status":"connected"}\n\n');
  
  // Check task status periodically
  const interval = setInterval(() => {
    const task = taskManager.getTask(taskId);
    
    if (!task) {
      res.write(`data: {"status":"error","message":"Task not found"}\n\n`);
      clearInterval(interval);
      res.end();
      return;
    }
    
    // Send progress update
    const progressData = {
      status: task.status,
      progress: task.progress,
      agentStatuses: task.agentStatuses?.map(agent => ({
        name: agent.name,
        status: agent.status,
        message: agent.message
      }))
    };
    
    res.write(`data: ${JSON.stringify(progressData)}\n\n`);
    
    // If task is completed or failed, send final data and close
    if (task.status === 'completed' || task.status === 'error') {
      const finalData = {
        status: task.status,
        progress: 100,
        finalReport: task.finalReport,
        sources: task.sources,
        error: task.error
      };
      
      res.write(`data: ${JSON.stringify(finalData)}\n\n`);
      clearInterval(interval);
      res.end();
    }
  }, 1000); // Check every second
  
  // Clean up on client disconnect
  req.on('close', () => {
    clearInterval(interval);
    res.end();
  });
});

// --- News API Endpoints ---

// Get news feed
router.get('/news/feed', async (req, res) => {
  try {
    const storageService = getStorageService();
    const { topicId, limit = 20, offset = 0 } = req.query;
    
    const articles = await storageService.getArticles({
      topicId,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.json({
      success: true,
      articles,
      total: await storageService.getArticleCount()
    });
    
  } catch (error) {
    console.error('Error fetching news feed:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch news feed'
    });
  }
});

// Get news statistics
router.get('/news/stats', async (req, res) => {
  try {
    const storageService = getStorageService();
    const stats = await storageService.getStats();
    
    res.json({
      success: true,
      stats
    });
    
  } catch (error) {
    console.error('Error fetching news stats:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch news statistics'
    });
  }
});

export { router }; 