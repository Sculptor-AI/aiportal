import * as fs from 'fs';
import * as path from 'path';
import { 
  NewsArticle, 
  NewsStorageService, 
  GetNewsRequest, 
  NewsStats,
  NewsGenerationCycle 
} from '../types';
import logger from '../utils/logger';
import { ConfigService } from './configService';

// Helper to ensure data directory exists
const ensureDataDirectoryExists = (filePath: string): void => {
  const dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return;
  }
  fs.mkdirSync(dirname, { recursive: true });
};

export class InMemoryStorageService implements NewsStorageService {
  private articles: Map<string, NewsArticle> = new Map();
  private generationCycles: Map<string, NewsGenerationCycle> = new Map();
  private lastCleanup: Date = new Date();
  private databasePath: string;

  constructor() {
    const config = ConfigService.getInstance().getConfig();
    this.databasePath = path.resolve(process.cwd(), config.databasePath);
    ensureDataDirectoryExists(this.databasePath);
    this._loadStore();
  }

  private _loadStore(): void {
    try {
      if (fs.existsSync(this.databasePath)) {
        const data = fs.readFileSync(this.databasePath, 'utf-8');
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
          logger.info('Article store loaded from JSON file', { path: this.databasePath });
        }
      } else {
        logger.info('No existing JSON store found, starting fresh.', { path: this.databasePath });
        this._persistStore(); // Create the file if it doesn't exist
      }
    } catch (error) {
      logger.error('Failed to load data from JSON file', { error, path: this.databasePath });
      // Start with an empty store if loading fails
      this.articles = new Map();
      this.generationCycles = new Map();
    }
  }

  private _persistStore(): void {
    try {
      const dataToStore = {
        articles: Array.from(this.articles.entries()),
        generationCycles: Array.from(this.generationCycles.entries()),
      };
      fs.writeFileSync(this.databasePath, JSON.stringify(dataToStore, null, 2), 'utf-8');
      logger.debug('Article store persisted to JSON file', { path: this.databasePath });
    } catch (error) {
      logger.error('Failed to persist data to JSON file', { error, path: this.databasePath });
    }
  }

  async getArticles(filter?: Partial<GetNewsRequest>): Promise<NewsArticle[]> {
    await this.cleanupExpiredArticles();
    
    let articles = Array.from(this.articles.values())
      .filter(article => article.status === 'published');

    // Apply filters
    if (filter?.topicId) {
      articles = articles.filter(a => a.topicId === filter.topicId);
    }

    // Sort
    const sortBy = filter?.sortBy || 'publishedAt';
    const sortOrder = filter?.sortOrder || 'desc';
    
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
    const offset = filter?.offset || 0;
    const limit = filter?.limit || 20;
    
    return articles.slice(offset, offset + limit);
  }

  async getArticle(id: string): Promise<NewsArticle | null> {
    return this.articles.get(id) || null;
  }

  async saveArticle(article: NewsArticle): Promise<void> {
    this.articles.set(article.id, article);
    this._persistStore();
    logger.debug('Article saved', { id: article.id, topic: article.topicId });
  }

  async updateArticle(id: string, updates: Partial<NewsArticle>): Promise<void> {
    const article = this.articles.get(id);
    if (!article) {
      throw new Error(`Article ${id} not found`);
    }
    
    const updated = {
      ...article,
      ...updates,
      updatedAt: new Date()
    };
    
    this.articles.set(id, updated);
    this._persistStore();
    logger.debug('Article updated', { id });
  }

  async deleteArticle(id: string): Promise<void> {
    const deleted = this.articles.delete(id);
    if (deleted) {
      this._persistStore();
      logger.debug('Article deleted', { id });
    }
  }

  async getArticlesByTopic(topicId: string): Promise<NewsArticle[]> {
    return Array.from(this.articles.values())
      .filter(article => article.topicId === topicId && article.status === 'published');
  }

  async getExpiredArticles(): Promise<NewsArticle[]> {
    const now = new Date();
    return Array.from(this.articles.values())
      .filter(article => article.expiresAt < now);
  }

  async getStats(): Promise<NewsStats> {
    await this.cleanupExpiredArticles();
    
    const articles = Array.from(this.articles.values())
      .filter(a => a.status === 'published');
    
    const articlesByTopic: { [topicId: string]: number } = {};
    let oldestArticle: Date | undefined;
    let newestArticle: Date | undefined;

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

  async saveGenerationCycle(cycle: NewsGenerationCycle): Promise<void> {
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

  async getGenerationCycle(id: string): Promise<NewsGenerationCycle | null> {
    return this.generationCycles.get(id) || null;
  }

  private async cleanupExpiredArticles(): Promise<void> {
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

  // Additional utility methods
  async getArticleCount(): Promise<number> {
    await this.cleanupExpiredArticles();
    return Array.from(this.articles.values())
      .filter(a => a.status === 'published').length;
  }

  async getArticleCountByTopic(topicId: string): Promise<number> {
    const articles = await this.getArticlesByTopic(topicId);
    return articles.length;
  }

  async archiveArticle(id: string): Promise<void> {
    await this.updateArticle(id, { status: 'archived' });
  }

  async publishArticle(id: string): Promise<void> {
    await this.updateArticle(id, { 
      status: 'published',
      publishedAt: new Date()
    });
  }

  async resetAllData(): Promise<{ articlesDeleted: number; cyclesDeleted: number }> {
    const articlesCount = this.articles.size;
    const cyclesCount = this.generationCycles.size;
    
    // Clear all data
    this.articles.clear();
    this.generationCycles.clear();
    
    // Persist empty state
    this._persistStore();
    
    logger.info('All data reset', { articlesDeleted: articlesCount, cyclesDeleted: cyclesCount });
    
    return {
      articlesDeleted: articlesCount,
      cyclesDeleted: cyclesCount
    };
  }
}

// Singleton instance
let storageInstance: InMemoryStorageService | null = null;

export const getStorageService = (): InMemoryStorageService => {
  if (!storageInstance) {
    storageInstance = new InMemoryStorageService();
  }
  return storageInstance;
}; 