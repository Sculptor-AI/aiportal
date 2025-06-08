import { config as dotenvConfig } from 'dotenv';
import { NewsApiConfig, TopicsConfig } from '../types';
import { DEFAULT_CONFIG } from '../constants';
import * as fs from 'fs';
import * as path from 'path';

// Explicitly load .env from the project root
dotenvConfig({ path: path.resolve(process.cwd(), '.env') });

export class ConfigService {
  private static instance: ConfigService;
  private config: NewsApiConfig;
  private topicsConfig: TopicsConfig;

  private constructor() {
    this.config = this.loadConfig();
    this.topicsConfig = this.loadTopicsConfig();
  }

  static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  private loadConfig(): NewsApiConfig {
    return {
      apiKey: process.env.API_KEY || '',
      port: parseInt(process.env.PORT || '') || DEFAULT_CONFIG.port!,
      nodeEnv: process.env.NODE_ENV || DEFAULT_CONFIG.nodeEnv!,
      rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '') || DEFAULT_CONFIG.rateLimitWindowMs!,
      rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '') || DEFAULT_CONFIG.rateLimitMaxRequests!,
      allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()) || DEFAULT_CONFIG.allowedOrigins!,
      newsGenerationSchedule: process.env.NEWS_GENERATION_SCHEDULE || DEFAULT_CONFIG.newsGenerationSchedule!,
      targetArticleCount: parseInt(process.env.TARGET_ARTICLE_COUNT || '') || DEFAULT_CONFIG.targetArticleCount!,
      minArticleCount: parseInt(process.env.MIN_ARTICLE_COUNT || '') || DEFAULT_CONFIG.minArticleCount!,
      maxArticleCount: parseInt(process.env.MAX_ARTICLE_COUNT || '') || DEFAULT_CONFIG.maxArticleCount!,
      articleLifetimeHours: parseInt(process.env.ARTICLE_LIFETIME_HOURS || '') || DEFAULT_CONFIG.articleLifetimeHours!,
      researchAgentsPerArticle: parseInt(process.env.RESEARCH_AGENTS_PER_ARTICLE || '') || DEFAULT_CONFIG.researchAgentsPerArticle!,
      autoStartGeneration: process.env.AUTO_START_GENERATION === 'true',
      logLevel: process.env.LOG_LEVEL || DEFAULT_CONFIG.logLevel!,
      logToFile: process.env.LOG_TO_FILE !== 'false',
      usePersistentStorage: process.env.USE_PERSISTENT_STORAGE === 'true',
      databasePath: process.env.DATABASE_PATH || DEFAULT_CONFIG.databasePath!,
      geminiTextModel: process.env.GEMINI_TEXT_MODEL || DEFAULT_CONFIG.geminiTextModel!,
      geminiSynthesisModel: process.env.GEMINI_SYNTHESIS_MODEL || DEFAULT_CONFIG.geminiSynthesisModel!,
      maxConcurrentArticleGeneration: parseInt(process.env.MAX_CONCURRENT_ARTICLE_GENERATION || '') || DEFAULT_CONFIG.maxConcurrentArticleGeneration!,
      generationTimeoutMs: parseInt(process.env.GENERATION_TIMEOUT_MS || '') || DEFAULT_CONFIG.generationTimeoutMs!,
    };
  }

  private loadTopicsConfig(): TopicsConfig {
    try {
      // Try to load local config first
      const localPath = path.join(process.cwd(), 'topics.local.json');
      if (fs.existsSync(localPath)) {
        const content = fs.readFileSync(localPath, 'utf-8');
        return JSON.parse(content);
      }

      // Fall back to default config
      const defaultPath = path.join(process.cwd(), 'topics.json');
      if (fs.existsSync(defaultPath)) {
        const content = fs.readFileSync(defaultPath, 'utf-8');
        return JSON.parse(content);
      }

      throw new Error('No topics configuration file found');
    } catch (error) {
      console.error('Error loading topics config:', error);
      // Return a minimal default config
      return {
        topics: [
          {
            id: 'general',
            name: 'General News',
            description: 'General news and current events',
            keywords: ['news', 'current events', 'breaking news'],
            priority: 1,
            minArticles: 5,
            maxArticles: 10,
          },
        ],
        settings: {
          balanceTopics: true,
          priorityWeight: 0.7,
          randomWeight: 0.3,
          refreshTopicsHours: 168,
        },
      };
    }
  }

  getConfig(): NewsApiConfig {
    return this.config;
  }

  getTopicsConfig(): TopicsConfig {
    return this.topicsConfig;
  }

  reloadTopicsConfig(): void {
    this.topicsConfig = this.loadTopicsConfig();
  }

  validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.config.apiKey) {
      errors.push('API_KEY is required');
    }

    if (this.config.minArticleCount > this.config.maxArticleCount) {
      errors.push('MIN_ARTICLE_COUNT cannot be greater than MAX_ARTICLE_COUNT');
    }

    if (this.config.targetArticleCount < this.config.minArticleCount || 
        this.config.targetArticleCount > this.config.maxArticleCount) {
      errors.push('TARGET_ARTICLE_COUNT must be between MIN_ARTICLE_COUNT and MAX_ARTICLE_COUNT');
    }

    if (this.config.researchAgentsPerArticle < 1 || this.config.researchAgentsPerArticle > 5) {
      errors.push('RESEARCH_AGENTS_PER_ARTICLE must be between 1 and 5');
    }

    // Validate cron schedule
    try {
      // Basic validation - could be enhanced with a proper cron parser
      const parts = this.config.newsGenerationSchedule.split(' ');
      if (parts.length !== 5) {
        errors.push('NEWS_GENERATION_SCHEDULE must be a valid cron expression');
      }
    } catch {
      errors.push('Invalid NEWS_GENERATION_SCHEDULE format');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
} 