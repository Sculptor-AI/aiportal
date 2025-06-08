import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { router as apiRouter } from './routes/api.js';
import imageGenerationRoutes from './routes/imageGenerationRoutes.js';
import { initializeGeminiService as initializeDeepResearch } from './services/deep-research/geminiService.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize integrated services
try {
  // Initialize Gemini service for deep research
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    console.error('WARNING: GEMINI_API_KEY not set. Deep research features will not work.');
  } else {
    initializeDeepResearch(geminiApiKey);
    console.log('✅ Deep Research service initialized');
    
    // Start news generation scheduler
    const { schedulerService } = await import('./services/news/schedulerService.js');
    schedulerService.start();
    console.log('✅ News generation scheduler started');
  }
  
  // Note: News service uses storage
  console.log('✅ News service ready');
  
} catch (error) {
  console.error('Error initializing services:', error);
}

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:5173',
      'http://localhost:3000'
    ];
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(helmet());

// Increase JSON body size limit to 50MB to handle base64 encoded images
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Log requests for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Add a preflight route to handle OPTIONS requests
app.options('*', cors(corsOptions));

// Routes
app.use('/api', apiRouter);
app.use('/api/v1/images', imageGenerationRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Server is running',
    services: {
      deepResearch: process.env.GEMINI_API_KEY ? 'active' : 'inactive',
      news: 'active'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('Integrated services:');
  console.log('- Deep Research API: /api/research/*');
  console.log('- News API: /api/news/*');
});

export default app; 