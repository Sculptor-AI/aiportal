import { Router, Request, Response } from 'express';
import { getStorageService } from '../services/storageService';
import { NewsGenerationService } from '../services/newsGenerationService';
import { ConfigService } from '../services/configService';
import { SchedulerService } from '../services/schedulerService';
import { NewsDiscoveryService } from '../services/newsDiscoveryService';
import { ArticleSelectionService } from '../services/articleSelectionService';
import { ProgressTrackingService } from '../services/progressTrackingService';
import { 
  GetNewsRequest, 
  GenerateNewsRequest,
  NewsApiResponse,
  GetNewsResponse,
  GenerateNewsResponse,
  NewsStats,
  DebugApiResponse
} from '../types';
import { ERROR_MESSAGES } from '../constants';
import logger from '../utils/logger';

const router = Router();
const storageService = getStorageService();
const generationService = NewsGenerationService.getInstance();
const configService = ConfigService.getInstance();
const schedulerService = SchedulerService.getInstance();
const discoveryService = NewsDiscoveryService.getInstance();
const selectionService = ArticleSelectionService.getInstance();
const progressService = ProgressTrackingService.getInstance();

// Specific news routes
// These must come before the parameterized /news/:id route

// GET /api/news/discover - Discover recent news events
router.get('/news/discover', async (req: Request, res: Response) => {
  try {
    const hours = parseInt(req.query.hours as string) || 24;
    const discovery = await discoveryService.discoverRecentNews(hours);
    
    res.json({
      success: true,
      data: discovery,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error discovering news', { error });
    res.status(500).json({
      success: false,
      error: ERROR_MESSAGES.INTERNAL_ERROR,
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/news/trending - Get trending stories
router.get('/news/trending', async (_req: Request, res: Response) => {
  try {
    const trending = await discoveryService.findTrendingStories();
    
    res.json({
      success: true,
      data: {
        stories: trending,
        count: trending.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error getting trending stories', { error });
    res.status(500).json({
      success: false,
      error: ERROR_MESSAGES.INTERNAL_ERROR,
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/news/coverage-gaps - Analyze coverage gaps
router.get('/news/coverage-gaps', async (_req: Request, res: Response) => {
  try {
    const currentArticles = await storageService.getArticles({ limit: 100 });
    const gaps = await discoveryService.identifyCoverageGaps(currentArticles);
    
    res.json({
      success: true,
      data: {
        gaps,
        gapCount: gaps.length,
        articleCount: currentArticles.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error analyzing coverage gaps', { error });
    res.status(500).json({
      success: false,
      error: ERROR_MESSAGES.INTERNAL_ERROR,
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/news/analysis - Get current news mix analysis
router.get('/news/analysis', async (_req: Request, res: Response) => {
  try {
    const currentArticles = await storageService.getArticles({ limit: 100 });
    const analysis = await selectionService.analyzeCurrentMix(currentArticles);
    
    res.json({
      success: true,
      data: analysis,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error analyzing news mix', { error });
    res.status(500).json({
      success: false,
      error: ERROR_MESSAGES.INTERNAL_ERROR,
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/news/topic/:topicId - Get articles by topic
router.get('/news/topic/:topicId', async (req: Request, res: Response) => {
  try {
    const articles = await storageService.getArticlesByTopic(req.params.topicId);
    
    res.json({
      success: true,
      data: {
        articles,
        total: articles.length,
        topicId: req.params.topicId
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching articles by topic', { error, topicId: req.params.topicId });
    res.status(500).json({
      success: false,
      error: ERROR_MESSAGES.INTERNAL_ERROR,
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/news/:id - Get single article
router.get('/news/:id', async (req: Request, res: Response) => {
  try {
    const article = await storageService.getArticle(req.params.id);
    
    if (!article) {
      return res.status(404).json({
        success: false,
        error: ERROR_MESSAGES.ARTICLE_NOT_FOUND,
        timestamp: new Date().toISOString()
      });
    }

    return res.json({
      success: true,
      data: article,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching article', { error, id: req.params.id });
    return res.status(500).json({
      success: false,
      error: ERROR_MESSAGES.INTERNAL_ERROR,
      timestamp: new Date().toISOString()
    });
  }
});

// General news routes
// GET /api/news - Get news articles
router.get('/news', async (req: Request, res: Response) => {
  try {
    const query: GetNewsRequest = {
      topicId: req.query.topicId as string,
      limit: parseInt(req.query.limit as string) || 20,
      offset: parseInt(req.query.offset as string) || 0,
      sortBy: (req.query.sortBy as 'publishedAt' | 'topicId') || 'publishedAt',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc'
    };

    const articles = await storageService.getArticles(query);
    const total = await storageService.getArticleCount();

    const response: NewsApiResponse<GetNewsResponse> = {
      success: true,
      data: {
        articles,
        total,
        limit: query.limit!,
        offset: query.offset!
      },
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error) {
    logger.error('Error fetching news', { error });
    res.status(500).json({
      success: false,
      error: ERROR_MESSAGES.INTERNAL_ERROR,
      timestamp: new Date().toISOString()
    });
  }
});

// POST /api/generate - Trigger news generation
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const request: GenerateNewsRequest = req.body;
    
    if (generationService.isCurrentlyGenerating() && !request.force) {
      return res.status(409).json({
        success: false,
        error: ERROR_MESSAGES.GENERATION_IN_PROGRESS,
        timestamp: new Date().toISOString()
      });
    }

    // If specific topic requested, generate single article
    if (request.topicId) {
      const article = await generationService.generateSingleArticle(request.topicId);
      return res.json({
        success: true,
        data: {
          cycleId: 'single-article',
          tasksCreated: 1,
          message: `Article generated for topic: ${article.topicName}`,
          articleId: article.id
        },
        timestamp: new Date().toISOString()
      });
    }

    // Otherwise, start a full generation cycle
    const cycle = await generationService.generateNewsCycle(request.force);
    
    const response: NewsApiResponse<GenerateNewsResponse> = {
      success: true,
      data: {
        cycleId: cycle.id,
        tasksCreated: cycle.tasks.length,
        message: `News generation cycle started with ${cycle.tasks.length} tasks`
      },
      timestamp: new Date().toISOString()
    };

    return res.json(response);
  } catch (error) {
    logger.error('Error generating news', { error });
    return res.status(500).json({
      success: false,
      error: ERROR_MESSAGES.GENERATION_FAILED,
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/stats - Get news statistics
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const stats = await storageService.getStats();
    const nextGeneration = schedulerService.getNextScheduledTime();
    
    const enrichedStats: NewsStats = {
      ...stats,
      nextGenerationTime: nextGeneration || undefined
    };

    res.json({
      success: true,
      data: enrichedStats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching stats', { error });
    res.status(500).json({
      success: false,
      error: ERROR_MESSAGES.INTERNAL_ERROR,
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/topics - Get configured topics
router.get('/topics', async (_req: Request, res: Response) => {
  try {
    const topicsConfig = configService.getTopicsConfig();
    
    res.json({
      success: true,
      data: topicsConfig,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching topics', { error });
    res.status(500).json({
      success: false,
      error: ERROR_MESSAGES.INTERNAL_ERROR,
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/health - Health check
router.get('/health', async (_req: Request, res: Response) => {
  try {
    const validation = configService.validateConfig();
    const isSchedulerRunning = schedulerService.isRunning();
    const articleCount = await storageService.getArticleCount();
    
    res.json({
      success: true,
      data: {
        status: validation.valid ? 'healthy' : 'unhealthy',
        configValid: validation.valid,
        configErrors: validation.errors,
        schedulerRunning: isSchedulerRunning,
        articleCount,
        uptime: process.uptime(),
        memory: process.memoryUsage()
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in health check', { error });
    res.status(500).json({
      success: false,
      error: ERROR_MESSAGES.INTERNAL_ERROR,
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/generation/progress - Get current generation progress
router.get('/generation/progress', async (_req: Request, res: Response) => {
  try {
    const progress = progressService.getCurrentProgress();
    
    res.json({
      success: true,
      data: {
        currentGeneration: progress
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error getting generation progress', { error });
    res.status(500).json({
      success: false,
      error: ERROR_MESSAGES.INTERNAL_ERROR,
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/debug/info - Get debug information
router.get('/debug/info', async (_req: Request, res: Response) => {
  try {
    const debugInfo = progressService.getDebugInfo();
    
    const response: DebugApiResponse = {
      success: true,
      data: {
        debugInfo
      },
      timestamp: new Date().toISOString()
    };
    
    res.json(response);
  } catch (error) {
    logger.error('Error getting debug info', { error });
    res.status(500).json({
      success: false,
      error: ERROR_MESSAGES.INTERNAL_ERROR,
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/debug/logs - Get recent logs
router.get('/debug/logs', async (req: Request, res: Response) => {
  try {
    const count = parseInt(req.query.count as string) || 100;
    const logs = progressService.getRecentLogs(count);
    
    const response: DebugApiResponse = {
      success: true,
      data: {
        logs
      },
      timestamp: new Date().toISOString()
    };
    
    res.json(response);
  } catch (error) {
    logger.error('Error getting logs', { error });
    res.status(500).json({
      success: false,
      error: ERROR_MESSAGES.INTERNAL_ERROR,
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/generation/history - Get generation history
router.get('/generation/history', async (_req: Request, res: Response) => {
  try {
    const debugInfo = progressService.getDebugInfo();
    
    res.json({
      success: true,
      data: {
        history: debugInfo.generationHistory,
        systemStatus: debugInfo.systemStatus
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error getting generation history', { error });
    res.status(500).json({
      success: false,
      error: ERROR_MESSAGES.INTERNAL_ERROR,
      timestamp: new Date().toISOString()
    });
  }
});

// POST /api/reset - Reset all data (DANGER!)
router.post('/reset', async (_req: Request, res: Response) => {
  try {
    logger.warn('Data reset requested');
    
    // Check if there's an active generation
    if (generationService.isCurrentlyGenerating()) {
      return res.status(409).json({
        success: false,
        error: 'Cannot reset while generation is in progress',
        timestamp: new Date().toISOString()
      });
    }
    
    // Reset all data
    const resetResult = await storageService.resetAllData();
    
    logger.info('Data reset completed', resetResult);
    
    return res.json({
      success: true,
      data: {
        message: 'All data has been reset successfully',
        ...resetResult
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error resetting data', { error });
    return res.status(500).json({
      success: false,
      error: ERROR_MESSAGES.INTERNAL_ERROR,
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/generation/stream - Server-Sent Events for real-time progress
router.get('/generation/stream', async (req: Request, res: Response) => {
  // Set up SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  // Send initial connection message
  res.write('data: {"type":"connected","message":"Connected to progress stream"}\n\n');

  // Send current progress if any
  const currentProgress = progressService.getCurrentProgress();
  if (currentProgress) {
    res.write(`data: ${JSON.stringify({ type: 'progress', data: currentProgress })}\n\n`);
  }

  // Set up event listeners
  const progressHandler = (event: any) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  const logHandler = (log: any) => {
    res.write(`data: ${JSON.stringify({ type: 'log', data: log })}\n\n`);
  };

  // Subscribe to progress events
  progressService.on('progress', progressHandler);
  progressService.on('log', logHandler);

  // Keep connection alive with periodic pings
  const pingInterval = setInterval(() => {
    res.write(':ping\n\n');
  }, 30000);

  // Clean up on client disconnect
  req.on('close', () => {
    progressService.removeListener('progress', progressHandler);
    progressService.removeListener('log', logHandler);
    clearInterval(pingInterval);
    res.end();
  });
});

export default router; 