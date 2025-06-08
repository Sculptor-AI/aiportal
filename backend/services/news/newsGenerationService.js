/**
 * @typedef {import('./types.js').NewsArticle} NewsArticle
 * @typedef {import('./types.js').NewsStats} NewsStats
 */

import { v4 as uuidv4 } from 'uuid';
import { NewsStorageService } from './storageService.js';
import { geminiService } from '../deep-research/geminiService.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class NewsGenerationService {
  constructor() {
    this.storageService = new NewsStorageService();
    this.isGenerating = false;
    this.topicsPath = path.join(__dirname, '../../data/topics.json');
  }

  /**
   * Load topics configuration
   * @returns {Promise<{topics: string[]}>}
   */
  async loadTopics() {
    try {
      const data = await fs.readFile(this.topicsPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Failed to load topics:', error);
      return { topics: ['Technology', 'Science', 'Business', 'Health'] };
    }
  }

  /**
   * Generate a single news article using Gemini
   * @param {string} topic
   * @returns {Promise<NewsArticle>}
   */
  async generateArticle(topic) {
    const prompt = `Generate a news article about recent developments in ${topic}. 
    
    The article should:
    - Focus on recent trends, innovations, or important updates
    - Be informative and engaging
    - Include specific examples or case studies
    - Be approximately 300-400 words
    
    Format the response as JSON with the following structure:
    {
      "title": "Article title",
      "summary": "2-3 sentence summary",
      "content": "Full article content",
      "tags": ["tag1", "tag2", "tag3"]
    }`;

    try {
      const response = await geminiService.generateContent(prompt);
      const articleData = JSON.parse(response);
      
      return {
        id: uuidv4(),
        title: articleData.title,
        summary: articleData.summary,
        content: articleData.content,
        category: topic,
        publishedAt: new Date().toISOString(),
        tags: articleData.tags,
        source: 'AI Generated',
        imageUrl: null
      };
    } catch (error) {
      console.error(`Failed to generate article for topic ${topic}:`, error);
      throw error;
    }
  }

  /**
   * Generate multiple news articles
   * @param {boolean} force - Force generation even if not scheduled
   * @returns {Promise<NewsArticle[]>}
   */
  async generateNewsCycle(force = false) {
    if (this.isGenerating && !force) {
      console.log('News generation already in progress');
      return [];
    }

    this.isGenerating = true;
    const generatedArticles = [];

    try {
      const { topics } = await this.loadTopics();
      const targetCount = parseInt(process.env.NEWS_TARGET_ARTICLE_COUNT || '25');
      const articlesPerTopic = Math.ceil(targetCount / topics.length);
      const maxConcurrent = parseInt(process.env.NEWS_MAX_CONCURRENT_ARTICLE_GENERATION || '2');

      console.log(`Starting news generation for ${topics.length} topics, ${articlesPerTopic} articles per topic`);

      // Process topics in batches
      for (let i = 0; i < topics.length; i += maxConcurrent) {
        const batch = topics.slice(i, i + maxConcurrent);
        const promises = [];

        for (const topic of batch) {
          for (let j = 0; j < articlesPerTopic; j++) {
            promises.push(this.generateArticle(topic));
          }
        }

        try {
          const articles = await Promise.all(promises);
          generatedArticles.push(...articles);
          console.log(`Generated ${articles.length} articles for batch ${i / maxConcurrent + 1}`);
        } catch (error) {
          console.error('Error generating batch:', error);
        }
      }

      // Save all generated articles
      for (const article of generatedArticles) {
        await this.storageService.saveArticle(article);
      }

      // Clean up old articles
      await this.storageService.cleanupOldArticles();

      console.log(`News generation complete. Generated ${generatedArticles.length} articles`);
      return generatedArticles;
    } finally {
      this.isGenerating = false;
    }
  }

  /**
   * Get generation status
   * @returns {{isGenerating: boolean}}
   */
  getStatus() {
    return { isGenerating: this.isGenerating };
  }
}

// Create singleton instance
export const newsGenerationService = new NewsGenerationService(); 