/**
 * RSS Feed Routes
 */

import { Hono } from 'hono';
import { RSS_FEEDS, fetchArticlesByCategory, fetchArticleContent } from '../services/rss.js';

const rss = new Hono();

/**
 * Get articles by category
 */
rss.get('/articles/:category', async (c) => {
  const category = c.req.param('category');
  const limit = parseInt(c.req.query('limit') || '20');
  const articles = await fetchArticlesByCategory(category, limit);
  return c.json({ articles });
});

/**
 * Get all articles
 */
rss.get('/articles', async (c) => {
  const limit = parseInt(c.req.query('limit') || '50');
  const allArticles = [];
  for (const category of Object.keys(RSS_FEEDS)) {
    const articles = await fetchArticlesByCategory(category, 10);
    allArticles.push(...articles);
  }
  allArticles.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
  return c.json({ articles: allArticles.slice(0, limit) });
});

/**
 * Get article content
 */
rss.get('/article-content', async (c) => {
  const articleUrl = c.req.query('url');
  if (!articleUrl) {
    return c.json({ error: 'URL parameter required' }, 400);
  }
  try {
    const content = await fetchArticleContent(articleUrl);
    return c.json(content);
  } catch (error) {
    return c.json({ error: 'Failed to fetch article content' }, 500);
  }
});

export default rss;

