import { v4 as uuidv4 } from 'uuid';
import { addHours } from 'date-fns';
import {
  NewsArticle,
  NewsGenerationTask,
  NewsGenerationCycle,
  Source,
  ArticleAssignment,
  ArticleSelectionCriteria,
  NewsArticleEnhanced
} from '../types';
import {
  extractHeadlineFromContent
} from './geminiService';
import { getStorageService } from './storageService';
import { ConfigService } from './configService';
import { NewsDiscoveryService } from './newsDiscoveryService';
import { ArticleSelectionService } from './articleSelectionService';
import { ProgressTrackingService } from './progressTrackingService';
import logger from '../utils/logger';

export class NewsGenerationService {
  private static instance: NewsGenerationService;
  private isGenerating: boolean = false;
  private currentCycle: NewsGenerationCycle | null = null;
  private configService: ConfigService;
  private storageService = getStorageService();
  private discoveryService: NewsDiscoveryService;
  private selectionService: ArticleSelectionService;
  private progressService: ProgressTrackingService;

  private constructor() {
    this.configService = ConfigService.getInstance();
    this.discoveryService = NewsDiscoveryService.getInstance();
    this.selectionService = ArticleSelectionService.getInstance();
    this.progressService = ProgressTrackingService.getInstance();
  }

  static getInstance(): NewsGenerationService {
    if (!NewsGenerationService.instance) {
      NewsGenerationService.instance = new NewsGenerationService();
    }
    return NewsGenerationService.instance;
  }

  async generateNewsCycle(force: boolean = false): Promise<NewsGenerationCycle> {
    if (this.isGenerating && !force) {
      throw new Error('News generation already in progress');
    }

    this.isGenerating = true;
    const config = this.configService.getConfig();

    const cycle: NewsGenerationCycle = {
      id: uuidv4(),
      startedAt: new Date(),
      status: 'running',
      articlesGenerated: 0,
      articlesDeleted: 0,
      tasks: []
    };

    this.currentCycle = cycle;
    await this.storageService.saveGenerationCycle(cycle);

    try {
      // Initialize progress tracking
      this.progressService.startGeneration(cycle, 1); // Will update with actual count later

      // Step 1: Clean up expired articles first
      this.progressService.updatePhase('initializing', 'Cleaning up expired articles...');
      const expiredArticles = await this.storageService.getExpiredArticles();
      for (const article of expiredArticles) {
        await this.storageService.deleteArticle(article.id);
        cycle.articlesDeleted++;
      }

      // Step 2: Discover recent news events
      this.progressService.updatePhase('discovery', 'Discovering recent news events...');
      logger.info('Discovering recent news events...');
      const newsDiscovery = await this.discoveryService.discoverRecentNews(24);
      
      // Also get trending stories
      const trendingStories = await this.discoveryService.findTrendingStories();
      newsDiscovery.events.push(...trendingStories);

      logger.info(`Found ${newsDiscovery.events.length} news events`);

      // Step 3: Get current articles and identify coverage gaps
      this.progressService.updatePhase('discovery', 'Analyzing coverage gaps...', { 
        eventsFound: newsDiscovery.events.length 
      });
      const currentArticles = await this.storageService.getArticles({ limit: 100 });
      const coverageGaps = await this.discoveryService.identifyCoverageGaps(currentArticles);

      // Step 4: Use AI to select which articles to write
      this.progressService.updatePhase('selection', 'Selecting articles to write...', { 
        gapsFound: coverageGaps.length 
      });
      const selectionCriteria: ArticleSelectionCriteria = {
        currentArticles,
        recentEvents: newsDiscovery.events,
        coverageGaps,
        storyCluster: [] // Will implement story clustering later
      };

      // Determine how many articles to generate
      const currentCount = await this.storageService.getArticleCount();
      const articlesToGenerate = Math.min(
        config.maxArticleCount - currentCount,
        Math.max(1, config.targetArticleCount - currentCount)
      );

      if (articlesToGenerate <= 0 && !force) {
        logger.info('Already at target article count');
        cycle.status = 'completed';
        cycle.completedAt = new Date();
        await this.storageService.saveGenerationCycle(cycle);
        return cycle;
      }

      // Step 5: Get article assignments from AI
      const assignments = await this.selectionService.selectNextArticles(
        selectionCriteria,
        force ? Math.max(3, articlesToGenerate) : articlesToGenerate
      );

      logger.info(`AI selected ${assignments.length} articles to write`);

      // Update progress with actual article count
      this.progressService.startGeneration(cycle, assignments.length);
      this.progressService.updatePhase('researching', `Researching and writing ${assignments.length} articles...`, { 
        articlesToGenerate: assignments.length 
      });

      // Step 6: Create generation tasks from assignments
      const tasks: NewsGenerationTask[] = assignments.map(assignment => ({
        id: uuidv4(),
        topicId: assignment.topicId,
        topicName: this.getTopicName(assignment.topicId),
        status: 'pending',
        progress: 0,
        startedAt: new Date(),
        assignment // Store the assignment for later use
      } as any));

      cycle.tasks = tasks;

      // Step 7: Process tasks with concurrency limit
      const maxConcurrent = config.maxConcurrentArticleGeneration;
      const results = await this.processTasksConcurrently(tasks, maxConcurrent);

      // Update cycle stats
      cycle.articlesGenerated = results.filter(r => r.success).length;
      cycle.completedAt = new Date();
      cycle.status = 'completed';

      // Update progress to publishing phase
      this.progressService.updatePhase('publishing', 'Publishing articles and finalizing...', {
        articlesGenerated: cycle.articlesGenerated
      });

      await this.storageService.saveGenerationCycle(cycle);
      
      // Complete progress tracking
      this.progressService.completeGeneration(cycle);
      
      logger.info('News generation cycle completed', {
        cycleId: cycle.id,
        generated: cycle.articlesGenerated,
        deleted: cycle.articlesDeleted
      });

    } catch (error) {
      cycle.status = 'failed';
      cycle.completedAt = new Date();
      await this.storageService.saveGenerationCycle(cycle);
      
      // Track error in progress
      this.progressService.addError(error instanceof Error ? error.message : 'Unknown error', { cycleId: cycle.id });
      this.progressService.updatePhase('failed', 'Generation failed', { error });
      this.progressService.completeGeneration(cycle);
      
      logger.error('News generation cycle failed', { error, cycleId: cycle.id });
      throw error;
    } finally {
      this.isGenerating = false;
      this.currentCycle = null;
      logger.info('Generation cycle finished and state reset.');
    }

    return cycle;
  }

  private getTopicName(topicId: string): string {
    const topic = this.configService.getTopicsConfig().topics.find(t => t.id === topicId);
    return topic?.name || topicId;
  }

  private async processTasksConcurrently(
    tasks: NewsGenerationTask[],
    maxConcurrent: number
  ): Promise<{ taskId: string; success: boolean; articleId?: string }[]> {
    const results: { taskId: string; success: boolean; articleId?: string }[] = [];
    
    // Process in batches
    for (let i = 0; i < tasks.length; i += maxConcurrent) {
      const batch = tasks.slice(i, i + maxConcurrent);
      const batchPromises = batch.map(task => this.generateArticleForTask(task));
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result, index) => {
        const task = batch[index];
        if (result.status === 'fulfilled') {
          results.push({
            taskId: task.id,
            success: true,
            articleId: result.value
          });
        } else {
          results.push({
            taskId: task.id,
            success: false
          });
          logger.error('Article generation failed', {
            taskId: task.id,
            error: result.reason
          });
        }
      });
    }
    
    return results;
  }

  private async generateArticleForTask(task: NewsGenerationTask): Promise<string> {
    const config = this.configService.getConfig();
    const assignment: ArticleAssignment = (task as any).assignment;
    
    if (!assignment) {
      throw new Error(`No assignment found for task ${task.id}`);
    }

    try {
      // Update task status and progress
      task.status = 'researching';
      task.progress = 10;
      this.progressService.updateArticleProgress(
        task.id,
        task.topicId,
        task.topicName,
        10,
        'Starting research...',
        assignment.suggestedHeadline
      );

      // Step 1: Get the news event details if available
      let eventContext = '';
      if (assignment.eventId) {
        // In a real implementation, we'd fetch the event from storage
        eventContext = `Breaking news about: ${assignment.suggestedHeadline}`;
      } else {
        eventContext = assignment.angle;
      }

      // Step 2: Configure specialized news research agents
      logger.debug('Configuring news research agents', { angle: assignment.angle });
      const agents = await this.configureNewsAgents(
        eventContext,
        assignment.researchFocus.slice(0, config.researchAgentsPerArticle)
      );
      task.progress = 30;
      this.progressService.updateArticleProgress(
        task.id,
        task.topicId,
        task.topicName,
        30,
        `Configuring ${agents.length} research agents...`
      );

      // Step 3: Run research agents in parallel with news focus
      task.status = 'researching';
      logger.debug('Running news research agents', { count: agents.length });
      this.progressService.updateArticleProgress(
        task.id,
        task.topicId,
        task.topicName,
        50,
        `Running ${agents.length} research agents...`
      );
      const researchPromises = agents.map(agent => 
        this.runNewsResearchAgent(agent, eventContext)
      );
      const researchResults = await Promise.all(researchPromises);
      task.progress = 70;
      this.progressService.updateArticleProgress(
        task.id,
        task.topicId,
        task.topicName,
        70,
        'Research complete, synthesizing article...'
      );

      // Collect all sources
      const allSources: Source[] = [];
      const sourceMap = new Map<string, Source>();
      
      for (const result of researchResults) {
        for (const source of result.sources) {
          if (!sourceMap.has(source.uri)) {
            const newSource = {
              ...source,
              id: allSources.length + 1
            };
            sourceMap.set(source.uri, newSource);
            allSources.push(newSource);
          }
        }
      }

      // Step 4: Synthesize news article with focus on timeliness
      task.status = 'writing';
      logger.debug('Synthesizing news article');
      this.progressService.updateArticleProgress(
        task.id,
        task.topicId,
        task.topicName,
        80,
        'Writing article...'
      );
      const { content, summary } = await this.synthesizeNewsArticle(
        assignment.suggestedHeadline,
        researchResults,
        allSources,
        assignment.newsType
      );
      task.progress = 90;
      this.progressService.updateArticleProgress(
        task.id,
        task.topicId,
        task.topicName,
        90,
        'Finalizing article...'
      );

      // Extract final headline from content
      const extractedHeadline = extractHeadlineFromContent(content);
      const finalHeadline = extractedHeadline || assignment.suggestedHeadline;
      
      // Log if we had to use fallback headline
      if (!extractedHeadline) {
        logger.warn('No headline found in content, using suggested headline', {
          newsType: assignment.newsType,
          suggestedHeadline: assignment.suggestedHeadline,
          contentPreview: content.substring(0, 200)
        });
      }
      
      // Ensure we always have a valid headline
      if (!finalHeadline || finalHeadline.trim() === '') {
        throw new Error(`Failed to generate headline for ${assignment.newsType} article on topic ${assignment.topicId}`);
      }

      // Calculate metadata
      const wordCount = content.split(/\s+/).length;
      const readingTime = Math.ceil(wordCount / 200);

      // Create enhanced news article
      const article: NewsArticleEnhanced = {
        id: uuidv4(),
        topicId: assignment.topicId,
        topicName: this.getTopicName(assignment.topicId),
        headline: finalHeadline,
        summary,
        content,
        publishedAt: new Date(),
        updatedAt: new Date(),
        expiresAt: addHours(new Date(), config.articleLifetimeHours),
        status: 'published',
        sources: allSources,
        researchData: researchResults,
        metadata: {
          readingTime,
          wordCount,
          tags: this.extractTags(assignment, content)
        },
        // Enhanced fields
        newsType: assignment.newsType,
        eventDate: assignment.eventId ? new Date() : undefined,
        storyAngle: assignment.angle,
        exclusivityScore: 0.8 // High score for unique angles
      };

      // Save article
      await this.storageService.saveArticle(article);
      
      // Update task
      task.status = 'completed';
      task.progress = 100;
      task.completedAt = new Date();
      task.articleId = article.id;

      // Track completion
      this.progressService.completeArticle(task.id, true);

      logger.info('News article generated successfully', {
        articleId: article.id,
        newsType: article.newsType,
        headline: finalHeadline
      });

      return article.id;

    } catch (error) {
      task.status = 'failed';
      task.error = error instanceof Error ? error.message : 'Unknown error';
      task.completedAt = new Date();
      
      // Track failure
      this.progressService.completeArticle(task.id, false, task.error);
      
      throw error;
    }
  }

  private async configureNewsAgents(eventContext: string, researchFocus: string[]): Promise<any[]> {
    // Import the function from constants
    const { configureNewsAgents } = await import('./geminiService');
    
    return configureNewsAgents(eventContext, researchFocus);
  }

  private async runNewsResearchAgent(agent: any, eventContext: string): Promise<any> {
    const { runNewsResearchAgent } = await import('./geminiService');
    
    // Add event context to the agent
    const enhancedAgent = {
      ...agent,
      eventContext
    };
    
    return runNewsResearchAgent(enhancedAgent);
  }

  private async synthesizeNewsArticle(
    headline: string,
    researchResults: any[],
    sources: Source[],
    newsType: string
  ): Promise<{ content: string; summary: string }> {
    const { synthesizeNewsArticle } = await import('./geminiService');
    
    // Pass newsType directly to synthesizeNewsArticle
    return synthesizeNewsArticle(headline, researchResults, sources, newsType);
  }

  private extractTags(assignment: ArticleAssignment, content: string): string[] {
    const tags: string[] = [];
    
    // Add news type as tag
    tags.push(assignment.newsType);
    
    // Add topic-based tags
    const topic = this.configService.getTopicsConfig().topics.find(t => t.id === assignment.topicId);
    if (topic) {
      tags.push(...topic.keywords.slice(0, 3));
    }
    
    // Extract additional tags from content (simple implementation)
    const importantWords = content
      .split(/\s+/)
      .filter(word => word.length > 6 && word[0] === word[0].toUpperCase())
      .slice(0, 2);
    
    tags.push(...importantWords);
    
    return [...new Set(tags)].slice(0, 5);
  }

  async generateSingleArticle(topicId: string): Promise<NewsArticle> {
    const topicsConfig = this.configService.getTopicsConfig();
    const topic = topicsConfig.topics.find(t => t.id === topicId);
    
    if (!topic) {
      throw new Error(`Topic ${topicId} not found`);
    }

    const task: NewsGenerationTask = {
      id: uuidv4(),
      topicId: topic.id,
      topicName: topic.name,
      status: 'pending',
      progress: 0,
      startedAt: new Date()
    };

    const articleId = await this.generateArticleForTask(task);
    const article = await this.storageService.getArticle(articleId);
    
    if (!article) {
      throw new Error('Article generation failed');
    }

    return article;
  }

  isCurrentlyGenerating(): boolean {
    return this.isGenerating;
  }

  getCurrentCycle(): NewsGenerationCycle | null {
    return this.currentCycle;
  }
} 