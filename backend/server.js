import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { router as apiRouter } from './routes/api.js';
import imageGenerationRoutes from './routes/imageGenerationRoutes.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configure CORS with settings for both local development and production
const corsOptions = {
  origin: [
    'http://localhost:3009', 
    'http://localhost:3010', 
    'http://127.0.0.1:3009', 
    'http://127.0.0.1:3010',
    'https://aiportal.vercel.app',
    'https://ai.explodingcb.com'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

// Middleware
// Disable helmet for local development to avoid CORS issues
// app.use(helmet({ 
//   crossOriginResourcePolicy: { policy: "cross-origin" } 
// })); 

// Enable CORS - this must come before other middleware
app.use(cors(corsOptions));

// Increase JSON body size limit to 50MB to handle base64 encoded images
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true })); // Also increase URL-encoded limit

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
  res.status(200).json({ status: 'OK', message: 'Server is running' });
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
  console.log(`CORS enabled for: ${corsOptions.origin.join(', ')}`);
});

export default app; 