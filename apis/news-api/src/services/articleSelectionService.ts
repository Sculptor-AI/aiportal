import { GoogleGenAI, GenerateContentParameters } from '@google/genai';
import { 
  ArticleSelectionCriteria,
  ArticleAssignment,
  NewsArticle
} from '../types';
import { ConfigService } from './configService';
import { GEMINI_FLASH_MODEL } from '../constants';
import logger from '../utils/logger';

export class ArticleSelectionService {
  private static instance: ArticleSelectionService;
  private configService: ConfigService;
  private ai: GoogleGenAI | null = null;

  private constructor() {
    this.configService = ConfigService.getInstance();
  }

  static getInstance(): ArticleSelectionService {
    if (!ArticleSelectionService.instance) {
      ArticleSelectionService.instance = new ArticleSelectionService();
    }
    return ArticleSelectionService.instance;
  }

  setAI(aiInstance: GoogleGenAI): void {
    this.ai = aiInstance;
  }

  async selectNextArticles(
    criteria: ArticleSelectionCriteria, 
    count: number
  ): Promise<ArticleAssignment[]> {
    if (!this.ai) {
      throw new Error("Gemini service not initialized for ArticleSelectionService");
    }

    const topicsConfig = this.configService.getTopicsConfig();

    // Analyze current article mix
    const currentMix = await this.analyzeCurrentMix(criteria.currentArticles);

    const prompt = `
You are an AI news editor deciding which articles to write next for a news platform.

Current Article Mix Analysis:
${JSON.stringify(currentMix, null, 2)}

Recent News Events (last 48 hours):
${JSON.stringify(criteria.recentEvents.map(e => ({
  id: e.id,
  headline: e.headline,
  topic: e.topicId,
  importance: e.importance,
  eventDate: e.eventDate
})), null, 2)}

Topics Configuration:
${JSON.stringify(topicsConfig.topics.map(t => ({
  id: t.id,
  name: t.name,
  priority: t.priority,
  currentCount: currentMix.topicCounts[t.id] || 0,
  minArticles: t.minArticles,
  maxArticles: t.maxArticles
})), null, 2)}

Your task is to select ${count} articles to write next. Consider:
1. Breaking news and major events should be covered immediately
2. Avoid duplicate angles - each article should offer something unique
3. Balance topic coverage based on priorities and limits
4. Mix article types (breaking news, analysis, updates, explainers)
5. Recent events take priority over older ones
6. High-importance gaps should be filled

For each article assignment, provide:
- topicId: which topic area
- eventId: if covering a specific event from the list
- angle: the unique angle/perspective for this article
- newsType: breaking/analysis/update/feature/explainer
- priority: 1-10 (10 being most urgent)
- researchFocus: array of specific things to research
- suggestedHeadline: a news-worthy headline

Return as JSON array of ${count} article assignments, ordered by priority.`;

    try {
      const params: GenerateContentParameters = {
        model: GEMINI_FLASH_MODEL,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          temperature: 0.4,
        }
      };

      const response = await this.ai.models.generateContent(params);
      const text = response.text || '';
      
      // Parse JSON response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No valid JSON array in response');
      }

      const assignments = JSON.parse(jsonMatch[0]);
      
      // Validate and enhance assignments
      return assignments.slice(0, count).map((assignment: any) => ({
        topicId: assignment.topicId || criteria.recentEvents[0]?.topicId || 'general',
        eventId: assignment.eventId,
        angle: assignment.angle || 'General coverage',
        newsType: assignment.newsType || 'feature',
        priority: Math.min(10, Math.max(1, assignment.priority || 5)),
        researchFocus: assignment.researchFocus || ['Research the latest developments'],
        suggestedHeadline: assignment.suggestedHeadline || 'Breaking News'
      }));

    } catch (error) {
      logger.error('Error selecting articles', { error });
      // Fallback selection based on events
      return this.fallbackSelection(criteria, count);
    }
  }

  async analyzeCurrentMix(articles: NewsArticle[]): Promise<any> {
    const mix = {
      totalArticles: articles.length,
      topicCounts: {} as Record<string, number>,
      newsTypeCounts: {} as Record<string, number>,
      ageDistribution: {
        last24h: 0,
        last48h: 0,
        last72h: 0,
        older: 0
      },
      averageWordCount: 0,
      coveredAngles: [] as string[]
    };

    const now = new Date();
    let totalWords = 0;

    for (const article of articles) {
      // Topic counts
      mix.topicCounts[article.topicId] = (mix.topicCounts[article.topicId] || 0) + 1;
      
      // News type counts (if available)
      const newsType = (article as any).newsType || 'feature';
      mix.newsTypeCounts[newsType] = (mix.newsTypeCounts[newsType] || 0) + 1;
      
      // Age distribution
      const ageHours = (now.getTime() - article.publishedAt.getTime()) / (1000 * 60 * 60);
      if (ageHours <= 24) mix.ageDistribution.last24h++;
      else if (ageHours <= 48) mix.ageDistribution.last48h++;
      else if (ageHours <= 72) mix.ageDistribution.last72h++;
      else mix.ageDistribution.older++;
      
      // Word count
      totalWords += article.metadata.wordCount;
      
      // Covered angles (from summaries)
      mix.coveredAngles.push(article.summary.substring(0, 100));
    }

    mix.averageWordCount = articles.length > 0 ? Math.round(totalWords / articles.length) : 0;

    return mix;
  }

  private fallbackSelection(
    criteria: ArticleSelectionCriteria, 
    count: number
  ): ArticleAssignment[] {
    const assignments: ArticleAssignment[] = [];
    
    // Prioritize breaking news events
    const breakingEvents = criteria.recentEvents
      .filter(e => e.importance === 'breaking' || e.importance === 'major')
      .slice(0, count);
    
    for (const event of breakingEvents) {
      assignments.push({
        topicId: event.topicId,
        eventId: event.id,
        angle: `Breaking: ${event.headline}`,
        newsType: 'breaking',
        priority: event.importance === 'breaking' ? 10 : 8,
        researchFocus: [
          'Latest details and updates',
          'Official statements and reactions',
          'Impact and implications'
        ],
        suggestedHeadline: event.headline
      });
    }
    
    // Fill remaining slots with coverage gaps
    const remaining = count - assignments.length;
    const gaps = criteria.coverageGaps
      .sort((a, b) => b.importance - a.importance)
      .slice(0, remaining);
    
    for (const gap of gaps) {
      assignments.push({
        topicId: gap.topicId,
        angle: gap.angle,
        newsType: 'analysis',
        priority: Math.min(9, gap.importance),
        researchFocus: [
          'Research the gap: ' + gap.reason,
          'Find unique perspectives',
          'Gather expert opinions'
        ],
        suggestedHeadline: `Analysis: ${gap.angle}`
      });
    }
    
    return assignments.slice(0, count);
  }
} 