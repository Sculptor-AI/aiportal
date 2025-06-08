import { v4 as uuidv4 } from 'uuid';
import { GoogleGenAI, GenerateContentParameters } from '@google/genai';
import { 
  NewsEvent, 
  NewsDiscoveryResult, 
  CoverageGap, 
  NewsArticle,
  NewsTopic 
} from '../types';
import { ConfigService } from './configService';
import { GEMINI_FLASH_MODEL } from '../constants';
import logger from '../utils/logger';

export class NewsDiscoveryService {
  private static instance: NewsDiscoveryService;
  private configService: ConfigService;
  private ai: GoogleGenAI | null = null;

  private constructor() {
    this.configService = ConfigService.getInstance();
  }

  static getInstance(): NewsDiscoveryService {
    if (!NewsDiscoveryService.instance) {
      NewsDiscoveryService.instance = new NewsDiscoveryService();
    }
    return NewsDiscoveryService.instance;
  }

  setAI(aiInstance: GoogleGenAI): void {
    this.ai = aiInstance;
  }

  async discoverRecentNews(hours: number = 24): Promise<NewsDiscoveryResult> {
    if (!this.ai) {
      throw new Error("Gemini service not initialized for NewsDiscoveryService");
    }

    const topics = this.configService.getTopicsConfig().topics;
    const events: NewsEvent[] = [];
    const trendingTopics: string[] = [];

    // Discover news for each topic
    for (const topic of topics) {
      try {
        const topicEvents = await this.discoverTopicNews(topic, hours);
        events.push(...topicEvents);
      } catch (error) {
        logger.error(`Failed to discover news for topic ${topic.id}`, { error });
      }
    }

    // Identify trending topics
    const eventsByTopic = events.reduce((acc, event) => {
      acc[event.topicId] = (acc[event.topicId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    trendingTopics.push(...Object.entries(eventsByTopic)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([topicId]) => topicId));

    // Identify coverage gaps (will be implemented after we have current articles)
    const coverageGaps: CoverageGap[] = [];

    return { events, trendingTopics, coverageGaps };
  }

  private async discoverTopicNews(topic: NewsTopic, hours: number): Promise<NewsEvent[]> {
    const prompt = `
You are a news discovery agent. Search for the most recent and newsworthy developments in the following area from the last ${hours} hours:

Topic: ${topic.name}
Keywords: ${topic.keywords.join(', ')}

Your task:
1. Find SPECIFIC recent events, announcements, or developments
2. Focus on things that happened in the last ${hours} hours
3. Prioritize breaking news and major developments
4. Each event should be a concrete, time-bound occurrence

For each newsworthy event found, provide:
- A specific headline (what happened)
- A brief summary (2-3 sentences)
- When it happened (approximate if needed)
- The primary source
- Importance level: breaking/major/standard/minor
- Key terms related to this specific event

Focus on ACTUAL NEWS - things that just happened or were just announced.
Return up to 5 most newsworthy events.

Format as JSON array of events.`;

    try {
      const params: GenerateContentParameters = {
        model: GEMINI_FLASH_MODEL,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          temperature: 0.3,
          tools: [{ googleSearch: {} }],
        }
      };

      const response = await this.ai!.models.generateContent(params);
      const text = response.text || '';
      
      // Parse the JSON response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        logger.warn('No JSON array found in discovery response');
        return [];
      }

      const rawEvents = JSON.parse(jsonMatch[0]);
      
      // Convert to NewsEvent objects
      return rawEvents.map((event: any) => ({
        id: uuidv4(),
        topicId: topic.id,
        headline: event.headline || 'Untitled Event',
        summary: event.summary || '',
        eventDate: event.when ? new Date(event.when) : new Date(),
        discoveredAt: new Date(),
        source: event.source || 'Unknown',
        importance: event.importance || 'standard',
        keywords: event.keywords || []
      }));

    } catch (error) {
      logger.error('Error discovering topic news', { error, topic: topic.id });
      return [];
    }
  }

  async findTrendingStories(): Promise<NewsEvent[]> {
    if (!this.ai) {
      throw new Error("Gemini service not initialized for NewsDiscoveryService");
    }

    const prompt = `
Search for the TOP TRENDING NEWS STORIES right now across all topics.
Focus on:
1. Stories that are dominating headlines
2. Major breaking news
3. Viral developments
4. Stories with significant public interest

Return the top 10 trending stories regardless of category.
Include only stories from the last 48 hours.

For each story provide:
- Headline
- Brief summary (2-3 sentences)
- Why it's trending
- Primary source
- Approximate time of event

Format as JSON array.`;

    try {
      const params: GenerateContentParameters = {
        model: GEMINI_FLASH_MODEL,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          temperature: 0.3,
          tools: [{ googleSearch: {} }],
        }
      };

      const response = await this.ai.models.generateContent(params);
      const text = response.text || '';
      
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        return [];
      }

      const trendingStories = JSON.parse(jsonMatch[0]);
      
      // Map to NewsEvent objects, inferring topic from content
      return trendingStories.map((story: any) => ({
        id: uuidv4(),
        topicId: this.inferTopicFromContent(story.headline + ' ' + story.summary),
        headline: story.headline,
        summary: story.summary,
        eventDate: story.time ? new Date(story.time) : new Date(),
        discoveredAt: new Date(),
        source: story.source || 'Trending',
        importance: 'major', // Trending stories are usually major
        keywords: this.extractKeywords(story.headline)
      }));

    } catch (error) {
      logger.error('Error finding trending stories', { error });
      return [];
    }
  }

  async identifyCoverageGaps(currentArticles: NewsArticle[]): Promise<CoverageGap[]> {
    if (!this.ai) {
      throw new Error("Gemini service not initialized for NewsDiscoveryService");
    }

    const recentEvents = await this.discoverRecentNews(48);
    const articleSummaries = currentArticles.map(article => ({
      headline: article.headline,
      topic: article.topicId,
      angle: article.summary
    }));

    const prompt = `
Analyze the coverage gaps between recent news events and current article coverage.

Recent News Events:
${JSON.stringify(recentEvents.events.map(e => ({
  headline: e.headline,
  topic: e.topicId,
  importance: e.importance
})), null, 2)}

Current Article Coverage:
${JSON.stringify(articleSummaries, null, 2)}

Identify:
1. Important stories not covered at all
2. Stories that need different angles
3. Developing stories that need updates
4. Missing perspectives on covered stories

For each gap, provide:
- topicId
- Specific angle needed
- Reason why this gap exists
- Importance score (1-10)

Return as JSON array of coverage gaps.`;

    try {
      const params: GenerateContentParameters = {
        model: GEMINI_FLASH_MODEL,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          temperature: 0.5,
        }
      };

      const response = await this.ai.models.generateContent(params);
      const text = response.text || '';
      
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        return [];
      }

      return JSON.parse(jsonMatch[0]);

    } catch (error) {
      logger.error('Error identifying coverage gaps', { error });
      return [];
    }
  }

  private inferTopicFromContent(content: string): string {
    const topics = this.configService.getTopicsConfig().topics;
    const contentLower = content.toLowerCase();
    
    // Simple keyword matching to infer topic
    for (const topic of topics) {
      const matchCount = topic.keywords.filter(keyword => 
        contentLower.includes(keyword.toLowerCase())
      ).length;
      
      if (matchCount >= 2) {
        return topic.id;
      }
    }
    
    // Default to first topic if no match
    return topics[0]?.id || 'general';
  }

  private extractKeywords(text: string): string[] {
    // Simple keyword extraction - could be enhanced
    const words = text.split(/\s+/)
      .filter(word => word.length > 4)
      .filter(word => !['the', 'and', 'for', 'with', 'that', 'this', 'from', 'have', 'been'].includes(word.toLowerCase()));
    
    return [...new Set(words)].slice(0, 5);
  }
} 