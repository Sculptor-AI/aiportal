import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
// import swaggerUi from 'swagger-ui-express'; // Commented out
// import swaggerJsdoc from 'swagger-jsdoc'; // Commented out
import { ConfigService } from './services/configService';
import { initializeGeminiService } from './services/geminiService';
import { SchedulerService } from './services/schedulerService';
import { NewsDiscoveryService } from './services/newsDiscoveryService';
import { ArticleSelectionService } from './services/articleSelectionService';
import newsRoutes from './routes/newsRoutes';
import logger from './utils/logger';
import { API_ENDPOINTS } from './constants';

// Initialize configuration
const configService = ConfigService.getInstance();
const config = configService.getConfig();

// Validate configuration
const validation = configService.validateConfig();
if (!validation.valid) {
  logger.error('Invalid configuration', { errors: validation.errors });
  process.exit(1);
}

// Initialize Gemini service
try {
  const { GoogleGenAI } = require('@google/genai');
  const ai = new GoogleGenAI({ apiKey: config.apiKey });
  
  initializeGeminiService(config.apiKey);
  
  // Initialize new services with AI instance
  NewsDiscoveryService.getInstance().setAI(ai);
  ArticleSelectionService.getInstance().setAI(ai);
  
  logger.info('All AI services initialized successfully');
} catch (error) {
  logger.error('Failed to initialize services', { error });
  process.exit(1);
}

// Create Express app
const app = express();

// Middleware
app.use(helmet());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// CORS
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    // You might want to restrict this to specific origins in production
    // For development, allowing all origins is often fine.
    // Example: allow all origins
    callback(null, true);
    // Example: restrict to a specific list of origins from config
    // if (config.allowedOrigins.includes(origin)) {
    //   callback(null, true);
    // } else {
    //   callback(new Error('Not allowed by CORS'));
    // }
  },
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxRequests,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Request logging
app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

// Swagger documentation
/* // Commenting out the entire swaggerOptions block
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'News Generation API',
      version: '1.0.0',
      description: 'Autonomous news generation system using multi-agent AI research',
      contact: {
        name: 'News AI',
        email: 'support@newsai.example.com'
      }
    },
    servers: [
      {
        url: `http://localhost:${config.port}`,
        description: 'Development server'
      }
    ],
    components: {
      schemas: {
        NewsArticle: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            topicId: { type: 'string' },
            topicName: { type: 'string' },
            headline: { type: 'string' },
            summary: { type: 'string' },
            content: { type: 'string' },
            publishedAt: { type: 'string', format: 'date-time' },
            sources: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  uri: { type: 'string' },
                  title: { type: 'string' }
                }
              }
            },
            metadata: {
              type: 'object',
              properties: {
                readingTime: { type: 'number' },
                wordCount: { type: 'number' },
                tags: { type: 'array', items: { type: 'string' } }
              }
            }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.ts']
};
*/

// const swaggerSpec = swaggerJsdoc(swaggerOptions); // Already commented out
// app.use(API_ENDPOINTS.API_DOCS, swaggerUi.serve, swaggerUi.setup(swaggerSpec)); // Already commented out

// Routes
app.use('/api', newsRoutes);

// Root endpoint
app.get('/', (_req, res) => {
  res.json({
    name: 'News Generation API',
    version: '1.0.0',
    status: 'running',
    documentation: API_ENDPOINTS.DOCS,
    endpoints: {
      news: API_ENDPOINTS.NEWS,
      generate: API_ENDPOINTS.GENERATE,
      stats: API_ENDPOINTS.STATS,
      topics: API_ENDPOINTS.TOPICS,
      health: API_ENDPOINTS.HEALTH
    }
  });
});

// Documentation page
app.get(API_ENDPOINTS.DOCS, (_req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>News Generation API Documentation</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
        h1 { color: #333; }
        h2 { color: #666; margin-top: 30px; }
        code { background: #f4f4f4; padding: 2px 5px; border-radius: 3px; }
        pre { background: #f4f4f4; padding: 15px; border-radius: 5px; overflow-x: auto; }
        .endpoint { margin: 20px 0; padding: 15px; border-left: 4px solid #007bff; background: #f8f9fa; }
        .method { font-weight: bold; color: #28a745; }
        .path { color: #007bff; }
      </style>
    </head>
    <body>
      <h1>News Generation API Documentation</h1>
      <p>An autonomous news generation system that uses multi-agent AI research to create news articles.</p>
      
      <h2>Getting Started</h2>
      <p>The API automatically generates news articles based on configured topics. Articles are created by multiple AI research agents and synthesized into professional news content.</p>
      
      <h2>Key Features</h2>
      <ul>
        <li>Autonomous news generation on a schedule</li>
        <li>Multi-agent research with up to 5 agents per article</li>
        <li>Topic-based article management</li>
        <li>Configurable article lifecycle and limits</li>
        <li>Real-time generation triggers</li>
      </ul>
      
      <h2>API Endpoints</h2>
      
      <div class="endpoint">
        <span class="method">GET</span> <span class="path">/api/news</span>
        <p>Get news articles with pagination and filtering</p>
        <p>Query parameters: topicId, limit, offset, sortBy, sortOrder</p>
      </div>
      
      <div class="endpoint">
        <span class="method">GET</span> <span class="path">/api/news/:id</span>
        <p>Get a single news article by ID</p>
      </div>
      
      <div class="endpoint">
        <span class="method">GET</span> <span class="path">/api/news/topic/:topicId</span>
        <p>Get all articles for a specific topic</p>
      </div>
      
      <div class="endpoint">
        <span class="method">POST</span> <span class="path">/api/generate</span>
        <p>Trigger news generation manually</p>
        <p>Body: { topicId?: string, force?: boolean }</p>
      </div>
      
      <div class="endpoint">
        <span class="method">GET</span> <span class="path">/api/stats</span>
        <p>Get system statistics and article counts</p>
      </div>
      
      <div class="endpoint">
        <span class="method">GET</span> <span class="path">/api/topics</span>
        <p>Get configured news topics</p>
      </div>
      
      <div class="endpoint">
        <span class="method">GET</span> <span class="path">/api/health</span>
        <p>Health check endpoint</p>
      </div>
      
      <h2>Configuration</h2>
      <p>The system is configured through environment variables and topics.json. Key settings:</p>
      <ul>
        <li><code>NEWS_GENERATION_SCHEDULE</code>: Cron expression for generation schedule</li>
        <li><code>TARGET_ARTICLE_COUNT</code>: Target number of articles to maintain</li>
        <li><code>ARTICLE_LIFETIME_HOURS</code>: How long articles remain before expiring</li>
        <li><code>RESEARCH_AGENTS_PER_ARTICLE</code>: Number of AI agents per article (1-5)</li>
      </ul>
    </body>
    </html>
  `);
});

// Error handling
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    timestamp: new Date().toISOString()
  });
});

// Start server
const PORT = config.port;
const server = app.listen(PORT, () => {
  logger.info(`News Generation API server started on port ${PORT}`);
  logger.info(`Documentation available at http://localhost:${PORT}${API_ENDPOINTS.DOCS}`);
  
  // Start the scheduler
  const schedulerService = SchedulerService.getInstance();
  schedulerService.start();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

export default app; 