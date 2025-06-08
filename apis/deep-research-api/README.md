# Deep Research AI API

A powerful Node.js TypeScript API that leverages Google's Gemini AI to conduct comprehensive research using multiple specialized agents. This API version is based on the Deep Research Demo React app, providing all the same functionality through a RESTful interface.

![Deep Research AI](https://img.shields.io/badge/AI-Research%20API-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-43853D?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-404D59?logo=express)

## 🚀 Features

- **🤖 Multi-Agent Research**: Deploy multiple AI agents with different perspectives and specializations
- **⚙️ Auto-Configuration**: Automatically configure optimal agents based on your research topic
- **📊 Real-time Progress**: Track research progress with detailed agent status updates
- **📝 Multiple Output Formats**: Generate reports, articles, or research papers
- **🔗 Citation Management**: Automatic source citation with customizable limits
- **🔍 Go Deeper Mode**: Creative deep research with up to 100 agents for maximum coverage
- **📚 Interactive Documentation**: Beautiful documentation with try-out functionality
- **🛡️ Enterprise Ready**: Rate limiting, CORS, security headers, and error handling

## 🏗️ Architecture

The API uses a multi-agent system where each agent specializes in different aspects:

- **Analyst Agent**: Factual overviews and statistics
- **Critical Agent**: Counterarguments and limitations
- **Innovator Agent**: Future implications and trends
- **Historical Agent**: Background and evolution
- **Ethics Agent**: Moral and societal considerations
- **Comparative Agent**: Comparisons and contrasts
- **Contextual Agent**: Regulatory and environmental factors
- **Data Mining Agent**: Quantitative data extraction
- **Impact Assessment Agent**: Cross-sector impact analysis
- **Solution Seeker Agent**: Problem-solving approaches

## 📋 Prerequisites

- **Node.js** 18.x or higher
- **Google Gemini API Key** ([Get one here](https://ai.google.dev/))
- **TypeScript** (installed via npm)

## 🔧 Installation

1. **Clone or create the project directory:**
   ```bash
   mkdir deep-research-api
   cd deep-research-api
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env` file in the root directory:
   ```env
   # Google Gemini API Key - Required
   API_KEY=your_google_gemini_api_key_here
   
   # Server Configuration
   PORT=3000
   NODE_ENV=development
   
   # API Configuration
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   MAX_CONCURRENT_RESEARCH_TASKS=10
   
   # CORS Settings (comma-separated origins)
   ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
   ```

4. **Build the project:**
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

The API will be available at:
- **Server**: http://localhost:3000
- **Documentation**: http://localhost:3000/docs
- **API Reference**: http://localhost:3000/api-docs
- **API Info**: http://localhost:3000/api

## 📖 API Endpoints

### Research Operations

#### Start Research Task
```http
POST /api/research
Content-Type: application/json

{
  "researchTopic": "The impact of artificial intelligence on healthcare",
  "responseType": "Report",
  "autoAgents": true,
  "includeCitations": true,
  "limitCitationsToThree": true,
  "goDeeper": false
}
```

**Response:**
```json
{
  "taskId": "uuid-generated-task-id",
  "status": "started"
}
```

#### Get Research Status
```http
GET /api/research/{taskId}
```

**Response:**
```json
{
  "taskId": "uuid-here",
  "status": "completed",
  "progress": 100,
  "agentStatuses": [
    {
      "id": "analyst-agent-0",
      "name": "Analyst Agent",
      "status": "completed",
      "message": "Found 5 potential sources.",
      "research": "Research summary...",
      "sources": [...]
    }
  ],
  "finalReport": "# Research Report\n\n...",
  "sources": [
    {
      "id": 1,
      "uri": "https://example.com/article",
      "title": "Article Title"
    }
  ]
}
```

#### Get Active Tasks
```http
GET /api/tasks
```

### Configuration

#### Auto-Configure Agents
```http
POST /api/configure-agents
Content-Type: application/json

{
  "researchTopic": "Climate change adaptation strategies"
}
```

## 🎯 Request Parameters

### Research Request
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `researchTopic` | string | Yes | The topic to research |
| `numAgents` | number | No | Number of agents (1-10, default: 3) |
| `autoAgents` | boolean | No | Use automatic agent configuration (default: true) |
| `responseType` | enum | No | Output format: "Report", "Article", "Research Paper" |
| `includeCitations` | boolean | No | Include citations (default: true) |
| `limitCitationsToThree` | boolean | No | Limit citations per claim (default: true) |
| `goDeeper` | boolean | No | Use creative deep research mode (default: false) |

### Response Types
- **Report**: Comprehensive, objective briefing
- **Article**: Compelling news-style article
- **Research Paper**: Formal academic paper with sections

## 🔄 Task Status Flow

1. **started** → Research task created
2. **configuring** → Auto-configuring agents (if enabled)
3. **researching** → Agents conducting research
4. **synthesizing** → Compiling final report
5. **completed** → Task finished successfully
6. **error** → Task failed

## 🛠️ Examples

### Basic Research
```bash
curl -X POST http://localhost:3000/api/research \
  -H "Content-Type: application/json" \
  -d '{
    "researchTopic": "Quantum computing applications",
    "responseType": "Report"
  }'
```

### Manual Agent Configuration
```bash
curl -X POST http://localhost:3000/api/research \
  -H "Content-Type: application/json" \
  -d '{
    "researchTopic": "Sustainable energy solutions",
    "autoAgents": false,
    "numAgents": 5,
    "responseType": "Research Paper",
    "includeCitations": true,
    "limitCitationsToThree": false
  }'
```

### Creative Deep Research
```bash
curl -X POST http://localhost:3000/api/research \
  -H "Content-Type: application/json" \
  -d '{
    "researchTopic": "Future of space exploration",
    "goDeeper": true,
    "responseType": "Article"
  }'
```

### Check Progress
```bash
curl http://localhost:3000/api/research/{taskId}
```

## 🔧 Configuration

### Environment Variables

- `API_KEY`: Google Gemini API key (required)
- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment mode
- `RATE_LIMIT_WINDOW_MS`: Rate limit window in milliseconds
- `RATE_LIMIT_MAX_REQUESTS`: Maximum requests per window
- `MAX_CONCURRENT_RESEARCH_TASKS`: Maximum concurrent tasks
- `ALLOWED_ORIGINS`: CORS allowed origins (comma-separated)

### Rate Limiting

Default: 100 requests per 15 minutes per IP address.

### CORS

Configured to allow requests from localhost origins by default. Update `ALLOWED_ORIGINS` for production.

## 🛡️ Security Features

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing control
- **Rate Limiting**: DDoS protection
- **Input Validation**: Request validation
- **Error Handling**: Secure error responses

## 📊 Monitoring

- Task progress tracking
- Agent status monitoring
- Automatic cleanup of old tasks
- Performance metrics

## 🐛 Error Handling

The API returns consistent error responses:

```json
{
  "error": "Error type",
  "message": "Detailed error message",
  "statusCode": 400,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

Common status codes:
- `400`: Bad Request - Invalid parameters
- `404`: Not Found - Task not found
- `429`: Too Many Requests - Rate limit exceeded
- `500`: Internal Server Error - Server issue

## 🔄 Development

### Scripts
- `npm run dev`: Development with hot reload
- `npm run build`: Build TypeScript
- `npm start`: Production start
- `npm run clean`: Clean build directory
- `npm test`: Run tests

### Project Structure
```
deep-research-api/
├── src/
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── types.ts         # TypeScript definitions
│   ├── constants.ts     # Configuration constants
│   └── server.ts        # Main server file
├── dist/               # Compiled JavaScript
├── package.json
├── tsconfig.json
└── README.md
```

## 📝 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 🆘 Support

- **Documentation**: Visit `/docs` for interactive documentation
- **API Reference**: Visit `/api-docs` for OpenAPI documentation
- **Issues**: Create an issue on GitHub

## 🔮 Roadmap

- [ ] WebSocket support for real-time updates
- [ ] Custom agent creation
- [ ] Research result caching
- [ ] Database persistence
- [ ] Authentication and authorization
- [ ] Batch processing
- [ ] Webhook notifications

---

**Built with ❤️ using TypeScript, Express.js, and Google Gemini AI** 