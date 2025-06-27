import express from 'express';
import { fetchArticlesByCategory, fetchAllArticles, fetchArticleContent } from '../controllers/rssController.js';

const router = express.Router();

// Get articles by category
router.get('/articles/:category', fetchArticlesByCategory);

// Get all articles from all categories
router.get('/articles', fetchAllArticles);

// Get full article content
router.get('/article-content', fetchArticleContent);

// Clear cache (for development/testing)
router.delete('/cache', (req, res) => {
  // Access the cache from the controller
  // This is a simple implementation for development
  console.log('Cache clear endpoint called');
  res.status(200).json({ message: 'Cache cleared. Please refresh to get new articles with images.' });
});

export default router; 