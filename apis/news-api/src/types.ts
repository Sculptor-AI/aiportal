// News Article Types
export interface NewsArticle {
  id: string;
  topicId: string;
  topicName: string;
  headline: string;
  summary: string;
  content: string;
  publishedAt: Date;
  updatedAt: Date;
  expiresAt: Date;
  status: 'draft' | 'published' | 'archived';
  sources: Source[];
  researchData?: AgentResearchResult[];
  metadata: ArticleMetadata;
}

export interface ArticleMetadata {
  readingTime: number; // in minutes
  wordCount: number;
  sentiment?: 'positive' | 'neutral' | 'negative';
  tags: string[];
  imageUrl?: string;
}

// Topic Configuration
export interface NewsTopic {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  priority: number; // 1 (highest) to 5 (lowest)
  minArticles: number;
  maxArticles: number;
}

export interface TopicsConfig {
  topics: NewsTopic[];
  settings: {
    balanceTopics: boolean;
    priorityWeight: number;
    randomWeight: number;
    refreshTopicsHours: number;
  };
}

// Research Agent Types (adapted from deep-research-api)
export interface NewsResearchAgent {
  name: string;
  focus: string;
  temperature: number;
  researchQuestion?: string;
}

export interface Source {
  id: number;
  uri: string;
  title: string;
}

export interface AgentResearchResult {
  agentName: string;
  researchQuestion: string;
  researchSummary: string;
  sources: Source[];
}

// News Generation Types
export interface NewsGenerationTask {
  id: string;
  topicId: string;
  topicName: string;
  status: 'pending' | 'researching' | 'writing' | 'completed' | 'failed';
  progress: number;
  startedAt: Date;
  completedAt?: Date;
  error?: string;
  articleId?: string;
}

export interface NewsGenerationCycle {
  id: string;
  startedAt: Date;
  completedAt?: Date;
  status: 'running' | 'completed' | 'failed';
  articlesGenerated: number;
  articlesDeleted: number;
  tasks: NewsGenerationTask[];
}

// API Request/Response Types
export interface NewsApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface GetNewsRequest {
  topicId?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'publishedAt' | 'topicId';
  sortOrder?: 'asc' | 'desc';
}

export interface GetNewsResponse {
  articles: NewsArticle[];
  total: number;
  limit: number;
  offset: number;
}

export interface GenerateNewsRequest {
  topicId?: string;
  count?: number;
  force?: boolean; // Force generation even if within limits
}

export interface GenerateNewsResponse {
  cycleId: string;
  tasksCreated: number;
  message: string;
}

export interface NewsStats {
  totalArticles: number;
  articlesByTopic: { [topicId: string]: number };
  oldestArticle?: Date;
  newestArticle?: Date;
  nextGenerationTime?: Date;
  lastGenerationCycle?: NewsGenerationCycle;
}

// Configuration Types
export interface NewsApiConfig {
  apiKey: string;
  port: number;
  nodeEnv: string;
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
  allowedOrigins: string[];
  newsGenerationSchedule: string;
  targetArticleCount: number;
  minArticleCount: number;
  maxArticleCount: number;
  articleLifetimeHours: number;
  researchAgentsPerArticle: number;
  autoStartGeneration: boolean;
  logLevel: string;
  logToFile: boolean;
  usePersistentStorage: boolean;
  databasePath: string;
  geminiTextModel: string;
  geminiSynthesisModel: string;
  maxConcurrentArticleGeneration: number;
  generationTimeoutMs: number;
}

// Error Types
export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
  timestamp: string;
}

// Service Types
export interface NewsStorageService {
  getArticles(filter?: Partial<GetNewsRequest>): Promise<NewsArticle[]>;
  getArticle(id: string): Promise<NewsArticle | null>;
  saveArticle(article: NewsArticle): Promise<void>;
  updateArticle(id: string, updates: Partial<NewsArticle>): Promise<void>;
  deleteArticle(id: string): Promise<void>;
  getArticlesByTopic(topicId: string): Promise<NewsArticle[]>;
  getExpiredArticles(): Promise<NewsArticle[]>;
  getStats(): Promise<NewsStats>;
}

// News Discovery Types
export interface NewsEvent {
  id: string;
  topicId: string;
  headline: string;
  summary: string;
  eventDate: Date;
  discoveredAt: Date;
  source: string;
  importance: 'breaking' | 'major' | 'standard' | 'minor';
  keywords: string[];
  relatedEvents?: string[];
}

export interface NewsDiscoveryResult {
  events: NewsEvent[];
  trendingTopics: string[];
  coverageGaps: CoverageGap[];
}

export interface CoverageGap {
  topicId: string;
  angle: string;
  reason: string;
  importance: number; // 1-10
}

// Story Tracking Types
export interface StoryCluster {
  id: string;
  primaryEvent: string;
  relatedArticles: string[];
  timeline: StoryEvent[];
  lastUpdated: Date;
  status: 'developing' | 'stable' | 'concluded';
}

export interface StoryEvent {
  date: Date;
  description: string;
  articleId?: string;
}

// Enhanced Article Types
export interface NewsArticleEnhanced extends NewsArticle {
  newsType: 'breaking' | 'analysis' | 'update' | 'feature' | 'explainer';
  eventDate?: Date;
  storyAngle: string;
  relatedArticles?: string[];
  storyClusterId?: string;
  exclusivityScore: number; // 0-1, how unique is this angle
}

// Article Selection Types
export interface ArticleSelectionCriteria {
  currentArticles: NewsArticle[];
  recentEvents: NewsEvent[];
  coverageGaps: CoverageGap[];
  storyCluster: StoryCluster[];
}

export interface ArticleAssignment {
  topicId: string;
  eventId?: string;
  angle: string;
  newsType: 'breaking' | 'analysis' | 'update' | 'feature' | 'explainer';
  priority: number;
  researchFocus: string[];
  suggestedHeadline: string;
}

// News Analysis Types
export interface NewsAnalysisResult {
  mainEvent: string;
  keyDevelopments: string[];
  stakeholders: string[];
  timeline: string;
  whyNowImportant: string;
  uniqueAngle: string;
  suggestedQuestions: string[];
}

// Service Types
export interface NewsDiscoveryService {
  discoverRecentNews(hours?: number): Promise<NewsDiscoveryResult>;
  findTrendingStories(): Promise<NewsEvent[]>;
  identifyCoverageGaps(currentArticles: NewsArticle[]): Promise<CoverageGap[]>;
}

export interface ArticleSelectionService {
  selectNextArticles(criteria: ArticleSelectionCriteria, count: number): Promise<ArticleAssignment[]>;
  analyzeCurrentMix(articles: NewsArticle[]): Promise<any>;
}

export interface StoryTrackingService {
  trackStory(article: NewsArticle): Promise<void>;
  getStoryClusters(): Promise<StoryCluster[]>;
  getStoryCluster(id: string): Promise<StoryCluster | null>;
  needsUpdate(clusterId: string): Promise<boolean>;
}

// Progress Tracking Types
export interface GenerationProgress {
  cycleId: string;
  overallProgress: number; // 0-100
  phase: 'initializing' | 'discovery' | 'selection' | 'researching' | 'writing' | 'publishing' | 'completed' | 'failed';
  phaseDescription: string;
  startTime: Date;
  estimatedTimeRemaining?: number; // seconds
  currentArticle?: {
    taskId: string;
    topicId: string;
    topicName: string;
    headline?: string;
    progress: number;
    phase: string;
  };
  articlesCompleted: number;
  articlesTotal: number;
  errors: string[];
}

// Debug Information Types
export interface DebugInfo {
  systemStatus: {
    uptime: number;
    memoryUsage: NodeJS.MemoryUsage;
    activeGeneration: boolean;
    lastError?: string;
    errorCount: number;
  };
  generationHistory: GenerationDebugEntry[];
  currentLogs: LogEntry[];
}

export interface GenerationDebugEntry {
  cycleId: string;
  startedAt: Date;
  completedAt?: Date;
  duration?: number; // milliseconds
  success: boolean;
  articlesGenerated: number;
  errors: string[];
  phases: PhaseDebugInfo[];
}

export interface PhaseDebugInfo {
  name: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  details: any;
  errors?: string[];
}

export interface LogEntry {
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  context?: any;
}

// Enhanced Generation Types
export interface EnhancedNewsGenerationTask extends NewsGenerationTask {
  phases: TaskPhase[];
  debugInfo: {
    agentCount: number;
    sourcesFound: number;
    researchTime?: number;
    synthesisTime?: number;
    retryCount: number;
  };
}

export interface TaskPhase {
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  startTime?: Date;
  endTime?: Date;
  details?: any;
}

// WebSocket/SSE Event Types
export interface ProgressEvent {
  type: 'progress' | 'article_completed' | 'cycle_completed' | 'error' | 'log';
  timestamp: Date;
  data: GenerationProgress | NewsArticle | GenerationDebugEntry | LogEntry | any;
}

// Enhanced API Response Types
export interface DebugApiResponse {
  success: boolean;
  data?: {
    currentGeneration?: GenerationProgress;
    debugInfo?: DebugInfo;
    logs?: LogEntry[];
  };
  error?: string;
  timestamp: string;
} 