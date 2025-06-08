import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class NewsStorageService {
  constructor() {
    this.articles = new Map();
    this.generationCycles = new Map();
    this.lastCleanup = new Date();
    this.dataPath = path.resolve(__dirname, '../../../data/news-articles.json');
    
    // Ensure data directory exists
    const dataDir = path.dirname(this.dataPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    this._loadStore();
  }

  _loadStore() {
    try {
      if (fs.existsSync(this.dataPath)) {
        const data = fs.readFileSync(this.dataPath, 'utf-8');
        if (data) {
          const parsedData = JSON.parse(data);
          this.articles = new Map(parsedData.articles || []);
          this.generationCycles = new Map(parsedData.generationCycles || []);
          
          // Convert date strings back to Date objects
          this.articles.forEach(article => {
            if (article.publishedAt) article.publishedAt = new Date(article.publishedAt);
            if (article.updatedAt) article.updatedAt = new Date(article.updatedAt);
            if (article.expiresAt) article.expiresAt = new Date(article.expiresAt);
          });
          this.generationCycles.forEach(cycle => {
            if (cycle.startedAt) cycle.startedAt = new Date(cycle.startedAt);
            if (cycle.completedAt) cycle.completedAt = new Date(cycle.completedAt);
          });
          console.log('News article store loaded from JSON file');
        }
      } else {
        console.log('No existing news store found, starting fresh.');
        this._persistStore();
      }
    } catch (error) {
      console.error('Failed to load news data from JSON file', error);
      this.articles = new Map();
      this.generationCycles = new Map();
    }
  }

  _persistStore() {
    try {
      const dataToStore = {
        articles: Array.from(this.articles.entries()),
        generationCycles: Array.from(this.generationCycles.entries()),
      };
      fs.writeFileSync(this.dataPath, JSON.stringify(dataToStore, null, 2), 'utf-8');
    } catch (error) {
      console.error('Failed to persist news data to JSON file', error);
    }
  }

  async getArticles(filter = {}) {
    await this.cleanupExpiredArticles();
    
    let articles = Array.from(this.articles.values())
      .filter(article => article.status === 'published');

    // Apply filters
    if (filter.topicId) {
      articles = articles.filter(a => a.topicId === filter.topicId);
    }

    // Sort
    const sortBy = filter.sortBy || 'publishedAt';
    const sortOrder = filter.sortOrder || 'desc';
    
    articles.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'publishedAt') {
        comparison = a.publishedAt.getTime() - b.publishedAt.getTime();
      } else if (sortBy === 'topicId') {
        comparison = a.topicId.localeCompare(b.topicId);
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    // Pagination
    const offset = filter.offset || 0;
    const limit = filter.limit || 20;
    
    return articles.slice(offset, offset + limit);
  }

  async getArticle(id) {
    return this.articles.get(id) || null;
  }

  async saveArticle(article) {
    this.articles.set(article.id, article);
    this._persistStore();
  }

  async getArticlesByTopic(topicId) {
    return Array.from(this.articles.values())
      .filter(article => article.topicId === topicId && article.status === 'published');
  }

  async getExpiredArticles() {
    const now = new Date();
    return Array.from(this.articles.values())
      .filter(article => article.expiresAt < now);
  }

  async deleteArticle(id) {
    const deleted = this.articles.delete(id);
    if (deleted) {
      this._persistStore();
    }
  }

  async getStats() {
    await this.cleanupExpiredArticles();
    
    const articles = Array.from(this.articles.values())
      .filter(a => a.status === 'published');
    
    const articlesByTopic = {};
    let oldestArticle;
    let newestArticle;

    for (const article of articles) {
      articlesByTopic[article.topicId] = (articlesByTopic[article.topicId] || 0) + 1;
      
      if (!oldestArticle || article.publishedAt < oldestArticle) {
        oldestArticle = article.publishedAt;
      }
      if (!newestArticle || article.publishedAt > newestArticle) {
        newestArticle = article.publishedAt;
      }
    }

    // Get last generation cycle
    const cycles = Array.from(this.generationCycles.values())
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
    const lastGenerationCycle = cycles[0];

    return {
      totalArticles: articles.length,
      articlesByTopic,
      oldestArticle,
      newestArticle,
      lastGenerationCycle
    };
  }

  async saveGenerationCycle(cycle) {
    this.generationCycles.set(cycle.id, cycle);
    
    // Keep only last 10 cycles
    const cycles = Array.from(this.generationCycles.entries())
      .sort((a, b) => b[1].startedAt.getTime() - a[1].startedAt.getTime());
    
    if (cycles.length > 10) {
      for (let i = 10; i < cycles.length; i++) {
        this.generationCycles.delete(cycles[i][0]);
      }
    }
    this._persistStore();
  }

  async cleanupExpiredArticles() {
    // Run cleanup at most once per hour
    const now = new Date();
    if (now.getTime() - this.lastCleanup.getTime() < 3600000) {
      return;
    }

    const expired = await this.getExpiredArticles();
    let persisted = false;
    for (const article of expired) {
      const deleted = this.articles.delete(article.id);
      if (deleted) persisted = true;
    }

    if (persisted) {
      this._persistStore();
    }

    this.lastCleanup = now;
  }

  async getArticleCount() {
    await this.cleanupExpiredArticles();
    return Array.from(this.articles.values())
      .filter(a => a.status === 'published').length;
  }
}

// Singleton instance
let storageInstance = null;

export const getStorageService = () => {
  if (!storageInstance) {
    storageInstance = new NewsStorageService();
  }
  return storageInstance;
}; 