# AI Portal Integration Documentation

## 🏗️ System Architecture

The AI Portal is an integrated system that combines multiple AI services into a unified backend:

1. **Main Backend** (Express.js server)
   - Handles all API requests
   - Manages authentication and routing
   - Integrates multiple AI services

2. **Deep Research Service** 
   - Multi-agent research synthesis
   - Uses Google Gemini AI for comprehensive research
   - Supports various output formats (Report, Article, Research Paper)

3. **News Service**
   - Automated news article generation
   - Topic-based content management
   - Scheduled generation cycles

4. **Frontend** (React + Vite)
   - Unified interface for all services
   - Real-time progress tracking
   - Client-side storage for research reports

## 📋 Configuration

### Environment Variables

Create a `.env` file in the `backend` directory by copying `config.example.txt`:

```bash
cp backend/config.example.txt backend/.env
```

#### Required Variables

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# AI & External API Keys
GEMINI_API_KEY=your_google_gemini_api_key_here      # Required for research & news
OPENROUTER_API_KEY=your_openrouter_api_key_here     # For chat features
BRAVE_API_KEY=your_brave_api_key_here               # For search features

# Deep Research API Settings
RESEARCH_MAX_CONCURRENT_TASKS=5
RESEARCH_TASK_RETENTION_HOURS=24

# News API Settings  
NEWS_GENERATION_SCHEDULE="0 */4 * * *"              # Cron format
NEWS_TARGET_ARTICLE_COUNT=25
NEWS_ARTICLE_LIFETIME_HOURS=72
NEWS_RESEARCH_AGENTS_PER_ARTICLE=3
NEWS_MAX_CONCURRENT_ARTICLE_GENERATION=2

# General App Settings
ALLOWED_ORIGINS=http://localhost:5173,https://your-domain.com
```

### News Topics Configuration

Edit `backend/data/topics.json` to configure news topics:

```json
{
  "topics": [
    {
      "id": "ai-technology",
      "name": "Artificial Intelligence & Technology",
      "keywords": ["AI", "machine learning", "technology"],
      "priority": 1,
      "minArticles": 3,
      "maxArticles": 6
    }
  ]
}
```

## 📡 Backend API Reference

### Deep Research Endpoints

#### Start Research Task
```http
POST /api/research/start
Content-Type: application/json

{
  "researchTopic": "The impact of AI on healthcare"
}
```

**Response:**
```json
{
  "success": true,
  "taskId": "uuid-here",
  "message": "Research task started successfully"
}
```

#### Stream Research Progress (SSE)
```http
GET /api/research/stream/{taskId}
```

**Event Stream Format:**
```javascript
// Initial connection
data: {"status":"connected"}

// Progress updates
data: {
  "status": "researching",
  "progress": 45,
  "agentStatuses": [
    {
      "name": "Analyst Agent",
      "status": "completed",
      "message": "Found 5 potential sources."
    }
  ]
}

// Final report
data: {
  "status": "completed",
  "progress": 100,
  "finalReport": "# Research Report\n\n...",
  "sources": [...]
}
```

### News API Endpoints

#### Get News Feed
```http
GET /api/news/feed?topicId=ai-technology&limit=20&offset=0
```

**Response:**
```json
{
  "success": true,
  "articles": [...],
  "total": 45
}
```

#### Get News Statistics
```http
GET /api/news/stats
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalArticles": 45,
    "articlesByTopic": {
      "ai-technology": 12,
      "climate-environment": 8
    }
  }
}
```

## 🔄 News Generation

### Manual Generation Script

To manually trigger news generation from the backend:

```bash
cd backend
npm run force-news-generation
```

This script bypasses the normal scheduling and generates articles immediately.

### Automatic Scheduling

News generation runs automatically based on the `NEWS_GENERATION_SCHEDULE` cron expression. Examples:

- `"0 */4 * * *"` - Every 4 hours
- `"0 9,18 * * *"` - Twice daily at 9 AM and 6 PM
- `"*/30 * * * *"` - Every 30 minutes (for testing)

## 🔒 Security Notes

### Input Sanitization
- All user inputs are validated and sanitized
- Research topics are trimmed and validated as strings
- SQL injection is not possible (no SQL database used)

### Proxy Architecture
- Frontend never directly accesses the AI services
- Backend acts as a secure proxy with locked-down configurations
- API keys are never exposed to the client

### Rate Limiting
- Configurable rate limits prevent abuse
- Default: 100 requests per 15 minutes per IP

## 💾 Frontend Data Flow

### Research Reports Storage

Research reports are stored in localStorage:

```javascript
// localStorage key: 'deepResearchReports'
[
  {
    id: 'task-id-123',
    topic: 'The Impact of AI on Healthcare',
    report: '# Research Report...',
    sources: [...],
    timestamp: '2023-10-27T10:00:00Z'
  }
]
```

### SSE Connection Management

```javascript
// Example SSE connection for progress tracking
const eventSource = new EventSource(`/api/research/stream/${taskId}`);

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  if (data.status === 'completed') {
    // Save report to localStorage
    const reports = JSON.parse(localStorage.getItem('deepResearchReports') || '[]');
    reports.push({
      id: taskId,
      topic: researchTopic,
      report: data.finalReport,
      sources: data.sources,
      timestamp: new Date().toISOString()
    });
    localStorage.setItem('deepResearchReports', JSON.stringify(reports));
    
    eventSource.close();
  }
};
```

## 🚀 Deployment

### Local Development

1. Install dependencies:
```bash
cd backend
npm install
```

2. Create and configure `.env` file

3. Start the backend:
```bash
npm run dev
```

4. Start the frontend:
```bash
cd ..
npm run dev
```

### Production Deployment

1. Build the frontend:
```bash
npm run build
```

2. Set production environment variables

3. Start the backend:
```bash
cd backend
NODE_ENV=production npm start
```

## 🐛 Troubleshooting

### Common Issues

1. **"GEMINI_API_KEY not set" warning**
   - Add your Gemini API key to the `.env` file
   - Get a key from https://ai.google.dev/

2. **CORS errors**
   - Ensure your frontend URL is in `ALLOWED_ORIGINS`
   - Check that credentials are included in requests

3. **Research task fails immediately**
   - Check the console for specific error messages
   - Verify API key is valid
   - Ensure topic is a non-empty string

4. **News articles not generating**
   - Check cron schedule format
   - Verify topics.json is properly configured
   - Run manual generation script to test

## 📊 Performance Considerations

- **Research Tasks**: Limited to 5 concurrent tasks by default
- **News Generation**: Processes up to 2 articles concurrently
- **Storage**: News articles stored in JSON file (consider database for production)
- **Memory**: Task cleanup runs every hour to free memory

## 🔗 Related Documentation

- [API Integration Plan](./API_INTEGRATION_PLAN.md)
- [Backend README](./backend/README.md)
- [Frontend Documentation](./README.md) 