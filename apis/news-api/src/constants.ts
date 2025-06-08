import { NewsApiConfig } from './types';

// Default configuration values
export const DEFAULT_CONFIG: Partial<NewsApiConfig> = {
  port: 3001,
  nodeEnv: 'development',
  rateLimitWindowMs: 15 * 60 * 1000, // 15 minutes
  rateLimitMaxRequests: 1000, // Increased for development
  allowedOrigins: ['http://localhost:3001', 'http://localhost:5173'],
  newsGenerationSchedule: '0 */6 * * *', // Every 6 hours
  targetArticleCount: 20,
  minArticleCount: 10,
  maxArticleCount: 30,
  articleLifetimeHours: 72,
  researchAgentsPerArticle: 5,
  autoStartGeneration: false,
  logLevel: 'info',
  logToFile: true,
  usePersistentStorage: false,
  databasePath: './data/news.db',
  geminiTextModel: 'gemini-2.5-flash-preview-04-17',
  geminiSynthesisModel: 'gemini-2.5-pro-preview-05-06',
  maxConcurrentArticleGeneration: 3,
  generationTimeoutMs: 300000, // 5 minutes
};

// Gemini Model Names
export const GEMINI_FLASH_MODEL = 'gemini-2.5-flash-preview-04-17';
export const GEMINI_PRO_MODEL = 'gemini-2.5-pro-preview-05-06';

// Agent Configuration
export const MAX_RESEARCH_AGENTS = 5;
export const MIN_RESEARCH_AGENTS = 1;
export const DEFAULT_AGENT_TEMPERATURE = 0.7;

// News Generation Prompts
export const NEWS_TOPIC_ANALYSIS_PROMPT = (topic: string, keywords: string[]) => `
Analyze the following news topic and generate a compelling, current news angle:

Topic: ${topic}
Keywords: ${keywords.join(', ')}

Your task is to:
1. Identify the most newsworthy and current aspect of this topic
2. Generate a specific news angle that would be relevant today
3. Suggest a headline that captures attention
4. Provide 3-5 specific research questions that agents should investigate

Format your response as JSON:
{
  "newsAngle": "Specific current angle for the story",
  "suggestedHeadline": "Compelling headline",
  "researchQuestions": [
    "Question 1",
    "Question 2",
    "Question 3"
  ]
}
`;

// Enhanced News-Focused Prompts
export const NEWS_EVENT_ANALYSIS_PROMPT = (event: string, topic: string, assignment: any) => `
You are analyzing a specific news event to create a news article.

Event: ${event}
Topic Area: ${topic}
Article Type: ${assignment.newsType}
Unique Angle: ${assignment.angle}

Analyze this event and provide:
1. The main news development (what happened, when, where, who)
2. Key stakeholders and their roles/statements
3. Timeline of events (be specific about dates/times)
4. Why this is newsworthy NOW
5. The unique angle we're taking that hasn't been covered
6. 5 specific research questions for our agents

Focus on RECENT developments (last 48 hours). Be specific about dates, times, and concrete details.

Format as JSON:
{
  "mainEvent": "What specifically happened",
  "keyDevelopments": ["Development 1", "Development 2"],
  "stakeholders": ["Person/Org 1 - their role", "Person/Org 2 - their role"],
  "timeline": "Specific timeline of events",
  "whyNowImportant": "Why this matters today",
  "uniqueAngle": "Our specific angle",
  "suggestedQuestions": ["Question 1", "Question 2", "Question 3", "Question 4", "Question 5"]
}
`;

export const NEWS_RESEARCH_AGENT_PROMPT = (agentName: string, focus: string, question: string, eventContext: string) => `
You are ${agentName}, a specialized news research agent.

Event Context: ${eventContext}
Your focus: ${focus}
Your specific research question: ${question}

Conduct thorough research using Google Search to answer your research question. 
Focus on:
- RECENT information (prioritize last 48 hours)
- Primary sources and official statements
- Specific facts, figures, and direct quotes
- Breaking developments and updates
- Verified information from credible news sources

Important: This is for a NEWS article about a CURRENT event. Focus on what's NEW and NEWSWORTHY.

Provide a comprehensive research summary that directly addresses your research question with recent, specific information.
`;

export const NEWS_SYNTHESIS_PROMPT = `
You are a professional news writer for a modern digital news platform. 

Based on the research provided by multiple agents about a CURRENT NEWS EVENT, write a compelling news article that:

1. **Headline**: Create a specific, timely headline that indicates this is current news
   - Use active voice and present tense
   - Include specific details (names, numbers, locations)
   - Make it clear this just happened
   - **IMPORTANT: Start your article with the headline as a Markdown H1 heading (# Headline)**

2. **Lead (First Paragraph)**: 
   - Answer WHO, WHAT, WHEN, WHERE, WHY in one compelling paragraph
   - Use specific times/dates (e.g., "announced Tuesday", "revealed this morning")
   - Hook the reader immediately

3. **Body**: 
   - Second paragraph: Most important new information
   - Use inverted pyramid style
   - Include direct quotes from stakeholders
   - Provide specific numbers, data, and facts
   - Use attribution phrases: "according to", "officials said", "sources confirmed"
   - Include reactions and implications
   - Compare to previous situations if relevant

4. **News Elements**:
   - Time markers throughout ("earlier today", "last night", "this week")
   - Attribution for all claims
   - Multiple perspectives where appropriate
   - Context without overwhelming the news

5. **Conclusion**: 
   - What happens next
   - Upcoming dates/deadlines
   - What to watch for

Style Guidelines:
- Write like a Reuters or AP journalist
- Short paragraphs (2-3 sentences max)
- Active voice, present tense for current events
- Specific details over generalizations
- Professional, objective tone
- Target length: 400-600 words

Format in Markdown with proper structure, starting with # Headline at the top.
Include citations in the format [1], [2], etc. for sources.
`;

// Agent Configuration for News
export const NEWS_AGENT_CONFIGURATION_PROMPT = (event: string, researchQuestions: string[]) => `
Based on the news event "${event}" and these research questions:
${researchQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

Configure ${researchQuestions.length} specialized news research agents. For each agent, provide:
- A descriptive name indicating their research specialty
- A specific focus area for investigating this news event
- Temperature setting based on research needs (0.2-0.4 for facts, 0.5-0.7 for analysis)

Agent types to consider:
- Breaking News Tracker (finds latest updates)
- Source Verifier (checks official statements)
- Impact Analyst (researches effects and implications)
- Background Researcher (provides context)
- Data Hunter (finds statistics and numbers)

Return as JSON:
{
  "agents": [
    {
      "name": "Agent Type - Specific Role",
      "focus": "Specific research focus for this event",
      "temperature": 0.3
    }
  ]
}
`;

// API Endpoints
export const API_ENDPOINTS = {
  NEWS: '/api/news',
  NEWS_BY_ID: '/api/news/:id',
  NEWS_BY_TOPIC: '/api/news/topic/:topicId',
  GENERATE: '/api/generate',
  STATS: '/api/stats',
  TOPICS: '/api/topics',
  HEALTH: '/api/health',
  DOCS: '/docs',
  API_DOCS: '/api-docs',
};

// Error Messages
export const ERROR_MESSAGES = {
  INVALID_API_KEY: 'Invalid or missing API key',
  ARTICLE_NOT_FOUND: 'Article not found',
  TOPIC_NOT_FOUND: 'Topic not found',
  GENERATION_IN_PROGRESS: 'News generation already in progress',
  GENERATION_FAILED: 'Failed to generate news article',
  INVALID_REQUEST: 'Invalid request parameters',
  INTERNAL_ERROR: 'Internal server error',
  RATE_LIMIT_EXCEEDED: 'Rate limit exceeded',
};

// Validation Constants
export const VALIDATION = {
  MIN_HEADLINE_LENGTH: 10,
  MAX_HEADLINE_LENGTH: 200,
  MIN_CONTENT_LENGTH: 100,
  MAX_CONTENT_LENGTH: 10000,
  MIN_SUMMARY_LENGTH: 50,
  MAX_SUMMARY_LENGTH: 500,
};

// Cron Schedule Presets
export const CRON_PRESETS = {
  EVERY_30_MINUTES: '*/30 * * * *',
  HOURLY: '0 * * * *',
  EVERY_2_HOURS: '0 */2 * * *',
  EVERY_6_HOURS: '0 */6 * * *',
  TWICE_DAILY: '0 9,18 * * *',
  DAILY: '0 0 * * *',
};

// Storage Keys
export const STORAGE_KEYS = {
  ARTICLES: 'news:articles',
  GENERATION_CYCLES: 'news:cycles',
  LAST_GENERATION: 'news:last_generation',
  STATS: 'news:stats',
}; 