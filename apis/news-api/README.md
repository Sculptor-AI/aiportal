# News Generation API

An autonomous news generation system that creates professional news articles using multi-agent AI research powered by Google's Gemini AI.

![News API](https://img.shields.io/badge/AI-News%20Generation-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-43853D?logo=node.js&logoColor=white)
![Gemini AI](https://img.shields.io/badge/Gemini-AI%20Powered-orange)

## 🚀 Features

- **🔍 Real-Time News Discovery**: Automatically discovers breaking news and trending stories
- **🤖 AI-Driven Article Selection**: Intelligent selection of news angles based on current events and coverage gaps
- **📰 News-Focused Writing**: Creates timely, professional news articles with proper attribution
- **👥 Multi-Agent Research**: Specialized agents for breaking news, verification, impact analysis, and data
- **📊 Coverage Analysis**: Identifies gaps in current coverage and suggests new angles
- **⏰ Lifecycle Management**: Automatic article expiration and cleanup
- **🎯 Smart Topic Balance**: AI ensures diverse coverage across all configured topics
- **📈 Trending Detection**: Identifies and prioritizes trending stories
- **🔄 Story Evolution**: Tracks developing stories and suggests updates
- **🤖 Autonomous News Generation**: Automatically generates news articles on a configurable schedule
- **📰 Topic-Based System**: Organizes news by configurable topics with balanced coverage
- **📊 Real-time Statistics**: Track article counts, generation cycles, and system health
- **🔄 Manual Triggers**: Generate news on-demand via API or command line
- **📝 Professional Output**: Creates well-structured articles with headlines, summaries, and citations
- **🔍 Source Attribution**: Includes verified sources from Google Search

## 🏗️ Architecture

The system uses an intelligent news generation pipeline:

1. **News Discovery**: Continuously scans for breaking news and recent developments
2. **AI Selection**: Analyzes current coverage and selects the most newsworthy angles
3. **Specialized Research**: Deploys targeted agents to research specific aspects
4. **Professional Synthesis**: Creates properly formatted news articles with citations
5. **Smart Publishing**: Manages article lifecycle and maintains optimal coverage

## 📋 Prerequisites

- **Node.js** 18.x or higher
- **Google Gemini API Key** ([Get one here](https://ai.google.dev/))
- **TypeScript** (installed via npm)

## 🔧 Installation

1. **Clone the repository:**
   ```bash
   cd news-api
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your Gemini API key:
   ```env
   API_KEY=your_google_gemini_api_key_here
   ```

4. **Configure topics (optional):**
   Edit `topics.json` to customize news topics or create `topics.local.json` for local overrides.

5. **Build the project:**
   ```bash
   npm run build
   ```

## 🚀 Usage

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

### Manual News Generation
```bash
npm run generate-news
```

The API will be available at:
- **Server**: http://localhost:3001
- **Documentation**: http://localhost:3001/docs
- **OpenAPI**: http://localhost:3001/api-docs

## 📖 API Endpoints

### News Operations

#### Get News Articles
```http
GET /api/news?topicId=ai-technology&limit=10&offset=0
```

#### Get Single Article
```http
GET /api/news/{articleId}
```

#### Get Articles by Topic
```http
GET /api/news/topic/{topicId}
```

### News Discovery

#### Discover Recent News
```http
GET /api/news/discover?hours=24
```
Returns recent news events from the specified time period.

#### Get Trending Stories
```http
GET /api/news/trending
```
Returns the top trending news stories across all topics.

#### Analyze Coverage Gaps
```http
GET /api/news/coverage-gaps
```
Analyzes current coverage and identifies missing angles.

#### Get News Mix Analysis
```http
GET /api/news/analysis
```
Returns detailed analysis of current article mix.

### Generation Control

#### Trigger News Generation
```http
POST /api/generate
Content-Type: application/json

{
  "topicId": "ai-technology",  // Optional: generate for specific topic
  "force": false               // Optional: force generation even if at limits
}
```

### System Information

#### Get Statistics
```http
GET /api/stats
```

#### Get Topics Configuration
```http
GET /api/topics
```

#### Health Check
```http
GET /api/health
```

## ⚙️ Configuration

### Environment Variables (.env)

```env
# API Keys
API_KEY=your_gemini_api_key_here

# Server
PORT=3001
NODE_ENV=development

# News Generation
NEWS_GENERATION_SCHEDULE=0 */6 * * *    # Every 6 hours
TARGET_ARTICLE_COUNT=20                 # Target number of articles
MIN_ARTICLE_COUNT=10                    # Minimum articles to maintain
MAX_ARTICLE_COUNT=30                    # Maximum articles allowed
ARTICLE_LIFETIME_HOURS=72               # Article expiration time
RESEARCH_AGENTS_PER_ARTICLE=5           # Number of AI agents (1-5)
AUTO_START_GENERATION=false             # Generate on startup

# Performance
MAX_CONCURRENT_ARTICLE_GENERATION=3     # Parallel article generation
GENERATION_TIMEOUT_MS=300000            # 5 minute timeout

# Gemini Models
GEMINI_TEXT_MODEL=gemini-2.5-flash-preview-04-17
GEMINI_SYNTHESIS_MODEL=gemini-2.5-pro-preview-05-06
```

### Topics Configuration (topics.json)

```json
{
  "topics": [
    {
      "id": "ai-technology",
      "name": "Artificial Intelligence & Technology",
      "description": "Latest developments in AI and tech",
      "keywords": ["AI", "machine learning", "technology"],
      "priority": 1,              // 1 (highest) to 5 (lowest)
      "minArticles": 3,          // Minimum articles for this topic
      "maxArticles": 6           // Maximum articles for this topic
    }
  ],
  "settings": {
    "balanceTopics": true,       // Balance articles across topics
    "priorityWeight": 0.7,       // Weight for topic priority
    "randomWeight": 0.3          // Random factor for variety
  }
}
```

### Cron Schedule Examples

- `*/30 * * * *` - Every 30 minutes
- `0 */2 * * *` - Every 2 hours
- `0 0 * * *` - Daily at midnight
- `0 9,18 * * *` - Twice daily at 9 AM and 6 PM
- `0 */6 * * *` - Every 6 hours (default)

## 📰 News Generation Process

### 1. Discovery Phase
- Scans for news events from the last 24-48 hours
- Identifies trending stories across all topics
- Prioritizes breaking news and major developments

### 2. Selection Phase
- AI analyzes current article mix
- Identifies coverage gaps and missing angles
- Selects diverse article types (breaking, analysis, updates, explainers)
- Avoids duplicate coverage

### 3. Research Phase
- Configures specialized agents:
  - **Breaking News Tracker**: Latest updates
  - **Source Verifier**: Official statements
  - **Impact Analyst**: Effects and implications
  - **Data Hunter**: Statistics and facts
  - **Context Provider**: Background information

### 4. Writing Phase
- Creates news-style headlines with specifics
- Writes compelling ledes answering 5 W's
- Uses inverted pyramid structure
- Includes time markers and attribution
- Professional AP/Reuters style

## 📊 Article Lifecycle

- **Creation**: Articles are generated with an expiration timestamp
- **Publication**: Articles are immediately available via API
- **Expiration**: Articles older than `ARTICLE_LIFETIME_HOURS` are automatically removed
- **Cleanup**: Expired articles are deleted during each generation cycle

## 🛠️ Development

### Project Structure
```
news-api/
├── src/
│   ├── routes/          # API endpoints
│   ├── services/        # Business logic
│   │   ├── configService.ts
│   │   ├── geminiService.ts
│   │   ├── newsGenerationService.ts
│   │   ├── schedulerService.ts
│   │   └── storageService.ts
│   ├── scripts/         # Utility scripts
│   ├── utils/           # Helper utilities
│   ├── types.ts         # TypeScript types
│   ├── constants.ts     # Constants and prompts
│   └── server.ts        # Main server
├── topics.json          # Topics configuration
├── .env.example         # Environment template
├── package.json
├── tsconfig.json
└── README.md
```

### Scripts
- `npm run dev` - Development with hot reload
- `npm run build` - Build TypeScript
- `npm start` - Production server
- `npm run generate-news` - Manual generation
- `npm test` - Run tests (when implemented)

## 🔍 Monitoring

### Logs
- Console output with timestamps and levels
- File logging to `logs/` directory (if enabled)
- Structured JSON logging for production

### Health Checks
The `/api/health` endpoint provides:
- Configuration validation status
- Scheduler status
- Article count
- Memory usage
- Uptime

## 🚨 Error Handling

- Invalid API key: Check your Gemini API key in `.env`
- Generation failures: Check logs for specific errors
- Rate limits: Gemini API has rate limits; adjust concurrency if needed
- Memory issues: Reduce `MAX_ARTICLE_COUNT` or implement persistent storage

## 🔒 Security

- API key stored in environment variables
- Rate limiting on all API endpoints
- CORS configuration for allowed origins
- Helmet.js for security headers
- Input validation on all endpoints

## 📝 Example Article Output

```markdown
# AI Breakthrough: New Language Model Achieves Human-Level Understanding

Researchers at leading AI labs have announced a significant breakthrough in natural language processing, with their latest model demonstrating unprecedented understanding of context and nuance in human communication.

The development, revealed today at the International Conference on Machine Learning, represents a major step forward in the quest for artificial general intelligence...

[Article continues with research findings, expert quotes, and implications]

Sources:
[1] Nature Machine Intelligence - "Contextual Understanding in Large Language Models"
[2] MIT Technology Review - "The Next Generation of AI Language Models"
[3] Google AI Blog - "Advances in Natural Language Understanding"
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Troubleshooting

### Common Issues

1. **"API_KEY environment variable not set"**
   - Ensure `.env` file exists and contains your Gemini API key

2. **"Invalid cron expression"**
   - Check `NEWS_GENERATION_SCHEDULE` format in `.env`

3. **"Rate limit exceeded"**
   - Reduce `MAX_CONCURRENT_ARTICLE_GENERATION`
   - Increase time between generation cycles

4. **Articles not generating**
   - Check `/api/health` endpoint
   - Review logs for errors
   - Verify topic configuration

### Debug Mode
Set `LOG_LEVEL=debug` in `.env` for verbose logging

## 🔮 Future Enhancements

- [ ] Persistent database storage (PostgreSQL/MongoDB)
- [ ] WebSocket support for real-time updates
- [ ] Custom agent creation
- [ ] Article categorization and tagging
- [ ] Sentiment analysis
- [ ] Multi-language support
- [ ] RSS feed generation
- [ ] Email notifications
- [ ] Admin dashboard

---

**Built with ❤️ using TypeScript, Express.js, and Google Gemini AI** 