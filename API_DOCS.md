# AI Portal Backend - API Documentation

## 🚀 Overview

The AI Portal Backend is a secure, scalable "Routerbox" system that provides OpenAI-compatible API endpoints while supporting multiple AI providers (Anthropic, OpenAI, Google Gemini, OpenRouter), custom model definitions, and real-time web search capabilities powered by Brave Search API.

## 📡 Network Access

### Base URLs
- **Local**: `http://localhost:3000`
- **Network**: `http://YOUR_IP:3000` (accessible from other devices on your network)
- **WSL/Docker**: Use your machine's IP address, not 127.0.0.1

### Finding Your IP Address
```bash
# Windows (in Command Prompt)
ipconfig

# Linux/Mac
ip addr show
# or
ifconfig
```

## 🔐 Authentication

The API supports two authentication methods:

### 1. JWT Tokens (Temporary - 7 days)
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. API Keys (Permanent)
```http
X-API-Key: ak_1234567890abcdef...
```

**Recommendation**: Use API keys for development as they don't expire.

---

## 📋 API Endpoints

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "your_username",
  "password": "YourPass123!",
  "email": "your@email.com"
}
```

**Password Requirements:**
- Minimum 8 characters
- At least one number
- At least one special character

**Response:**
```json
{
  "success": true,
  "message": "User created successfully",
  "userId": 1
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "your_username",
  "password": "YourPass123!"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "username": "your_username"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "abc123..."
  }
}
```

#### Generate API Key
```http
POST /api/auth/api-keys
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN

{
  "keyName": "My Development Key"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "apiKey": "ak_1234567890abcdef...",
    "keyName": "My Development Key",
    "message": "API key generated successfully. Store it securely - it will not be shown again."
  }
}
```

#### List API Keys
```http
GET /api/auth/api-keys
Authorization: Bearer YOUR_JWT_TOKEN
```

---

### Chat API (Main Routerbox)

The main chat API supports both standard AI chat completions and enhanced web search capabilities. All models can be augmented with real-time web search using the Brave Search API.

#### Chat Completions (OpenAI-Compatible)
```http
POST /api/v1/chat/completions
Content-Type: application/json
X-API-Key: YOUR_API_KEY

{
  "model": "custom/coding-assistant",
  "messages": [
    {
      "role": "user",
      "content": "How do I implement a binary search in Python?"
    }
  ],
  "temperature": 0.7,
  "max_tokens": 2000,
  "stream": false
}
```

#### Chat with Web Search
```http
POST /api/v1/chat/completions
Content-Type: application/json
X-API-Key: YOUR_API_KEY

{
  "model": "anthropic/claude-4-sonnet",
  "messages": [
    {
      "role": "user",
      "content": "What is the latest news about artificial intelligence?"
    }
  ],
  "web_search": true,
  "temperature": 0.7,
  "stream": false
}
```

**Web Search Parameters:**
- `web_search` (boolean): Enable real-time web search using Brave Search API
- `search_query` (string, optional): Custom search query. If not provided, uses the user's message content

**How Web Search Works:**
1. The system performs a web search using your query
2. Scrapes and extracts content from top search results
3. Provides this current information to the AI model
4. The model synthesizes an answer based on the latest web data
5. Sources are included in the response for verification

**Available Models:**

**Custom Models:**
- `custom/coding-assistant` - Programming specialist (Claude Sonnet)
- `custom/creative-writer` - Creative writing assistant (Claude Opus)
- `custom/data-analyst` - Data analysis expert (GPT-4o)
- `custom/fast-responder` - Quick responses (Gemini Flash)

**Direct Provider Models (All support web search):**
- `anthropic/claude-4-opus` - Claude 4 Opus
- `anthropic/claude-4-sonnet` - Claude 4 Sonnet  
- `openai/gpt-4o` - GPT-4o
- `openai/o3` - ChatGPT o3
- `google/gemini-2.5-flash` - Gemini 2.5 Flash
- `google/gemini-2.5-pro` - Gemini 2.5 Pro

**Response:**
```json
{
  "id": "chatcmpl-123",
  "object": "chat.completion",
  "created": 1677652288,
  "model": "custom/coding-assistant",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Here's how to implement binary search in Python:\n\n```python\ndef binary_search(arr, target):\n    left, right = 0, len(arr) - 1\n    \n    while left <= right:\n        mid = (left + right) // 2\n        if arr[mid] == target:\n            return mid\n        elif arr[mid] < target:\n            left = mid + 1\n        else:\n            right = mid - 1\n    \n    return -1\n```"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 20,
    "completion_tokens": 100,
    "total_tokens": 120
  }
}
```

**Web Search Response (includes sources):**
```json
{
  "id": "chatcmpl-124",
  "object": "chat.completion",
  "created": 1677652288,
  "model": "anthropic/claude-4-sonnet",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Based on the latest search results, here are recent developments in artificial intelligence:\n\n1. **New LLM Architectures**: Recent breakthroughs in transformer architectures have led to more efficient models with improved reasoning capabilities.\n\n2. **AI Safety Progress**: Researchers have developed new alignment techniques to ensure AI systems better follow human intentions and values.\n\n3. **Computer Vision Advances**: New multimodal models can now understand images and text together with unprecedented accuracy.\n\nThese developments represent significant progress in making AI more capable, safer, and more useful for real-world applications."
      },
      "finish_reason": "stop"
    }
  ],
  "sources": [
    {
      "title": "Latest AI Research Breakthroughs - MIT Technology Review",
      "url": "https://www.technologyreview.com/ai-breakthroughs",
      "snippet": "Recent developments in artificial intelligence show promising advances in model efficiency and safety..."
    },
    {
      "title": "AI Safety Progress Report 2024",
      "url": "https://www.anthropic.com/safety-progress-2024",
      "snippet": "New alignment techniques have been developed to ensure AI systems better follow human intentions..."
    }
  ],
  "usage": {
    "prompt_tokens": 1250,
    "completion_tokens": 300,
    "total_tokens": 1550
  }
}
```

**Key Benefits of Web Search:**
- 🔍 **Real-time Information**: Get the latest news, events, and data
- 📊 **Current Statistics**: Access up-to-date numbers and trends  
- 🌐 **Diverse Sources**: Information from multiple authoritative websites
- 📝 **Source Attribution**: All sources are provided for fact-checking
- ⚡ **Fast Processing**: Results typically returned in 2-5 seconds

#### Streaming Chat
```http
POST /api/v1/chat/completions
Content-Type: application/json
X-API-Key: YOUR_API_KEY

{
  "model": "custom/fast-responder",
  "messages": [
    {
      "role": "user",
      "content": "Tell me a joke"
    }
  ],
  "stream": true
}
```

**Response:** Server-Sent Events (SSE)
```
data: {"choices":[{"delta":{"content":"Why"}}]}
data: {"choices":[{"delta":{"content":" don't"}}]}
data: {"choices":[{"delta":{"content":" scientists"}}]}
data: [DONE]
```

#### Streaming Chat with Web Search
```http
POST /api/v1/chat/completions
Content-Type: application/json
X-API-Key: YOUR_API_KEY

{
  "model": "anthropic/claude-4-sonnet",
  "messages": [
    {
      "role": "user",
      "content": "What's happening with SpaceX today?"
    }
  ],
  "web_search": true,
  "stream": true
}
```

**Response:** Server-Sent Events (SSE) with sources
```
data: {"type":"sources","sources":[{"title":"SpaceX Falcon Heavy Launch Success","url":"https://spacex.com/news/falcon-heavy-success","snippet":"SpaceX successfully launched Falcon Heavy today..."},{"title":"NASA SpaceX Partnership Update","url":"https://nasa.gov/spacex-update","snippet":"NASA and SpaceX continue their collaboration..."}]}

data: {"choices":[{"delta":{"content":"Based"}}]}

data: {"choices":[{"delta":{"content":" on"}}]}

data: {"choices":[{"delta":{"content":" today's"}}]}

data: {"choices":[{"delta":{"content":" latest"}}]}

data: {"choices":[{"delta":{"content":" SpaceX"}}]}

data: {"choices":[{"delta":{"content":" news,"}}]}

data: {"choices":[{"delta":{"content":" here's"}}]}

data: {"choices":[{"delta":{"content":" what's"}}]}

data: {"choices":[{"delta":{"content":" happening:\n\n**Falcon"}}]}

data: {"choices":[{"delta":{"content":" Heavy"}}]}

data: {"choices":[{"delta":{"content":" Success**:"}}]}

data: {"choices":[{"delta":{"content":" SpaceX"}}]}

data: {"choices":[{"delta":{"content":" successfully"}}]}

data: {"choices":[{"delta":{"content":" launched"}}]}

data: [DONE]
```

**Streaming Web Search Features:**
- 📡 **Sources First**: Sources are sent immediately after search completion
- ⚡ **Real-time Streaming**: Response streams as the AI processes the information
- 🔄 **Live Updates**: Perfect for real-time news and current events
- 📱 **Client-Friendly**: Easy to parse and display in web/mobile apps

#### List Models
```http
GET /api/v1/chat/models
X-API-Key: YOUR_API_KEY
```

**Response:**
```json
{
  "object": "list",
  "data": [
    {
      "id": "anthropic/claude-4-opus",
      "object": "model",
      "created": 1677649963,
      "owned_by": "anthropic"
    },
    {
      "id": "custom/coding-assistant",
      "object": "model",
      "created": 1677649963,
      "owned_by": "custom",
      "description": "An AI assistant specialized in programming",
      "name": "Coding Assistant",
      "capabilities": ["text", "code"]
    }
  ]
}
```

---

### 🌐 Web Search Capabilities

The AI Portal supports real-time web search powered by the Brave Search API. This feature can be enabled for any model to provide current information.

#### Web Search Use Cases

**📰 Current Events & News**
```http
POST /api/v1/chat/completions
Content-Type: application/json
X-API-Key: YOUR_API_KEY

{
  "model": "anthropic/claude-4-sonnet",
  "messages": [
    {
      "role": "user",
      "content": "What are the latest developments in the Russia-Ukraine conflict?"
    }
  ],
  "web_search": true
}
```

**📊 Real-time Data & Statistics** 
```http
POST /api/v1/chat/completions
Content-Type: application/json
X-API-Key: YOUR_API_KEY

{
  "model": "openai/gpt-4o",
  "messages": [
    {
      "role": "user",
      "content": "What is the current price of Bitcoin and recent market trends?"
    }
  ],
  "web_search": true
}
```

**🏢 Company & Business Information**
```http
POST /api/v1/chat/completions
Content-Type: application/json
X-API-Key: YOUR_API_KEY

{
  "model": "custom/data-analyst",
  "messages": [
    {
      "role": "user",
      "content": "What is Tesla's latest quarterly earnings report?"
    }
  ],
  "web_search": true
}
```

**🔬 Research & Academic Information**
```http
POST /api/v1/chat/completions
Content-Type: application/json
X-API-Key: YOUR_API_KEY

{
  "model": "google/gemini-2.5-pro",
  "messages": [
    {
      "role": "user",
      "content": "What are the latest findings in quantum computing research?"
    }
  ],
  "web_search": true,
  "search_query": "quantum computing breakthrough 2024 research papers"
}
```

#### Search Quality & Source Prioritization

The web search system intelligently prioritizes sources:

1. **🏛️ Authoritative Sources**: Government sites (.gov), educational institutions (.edu)
2. **📚 Reference Sources**: Wikipedia, established encyclopedias
3. **📰 News Organizations**: Reuters, BBC, CNN, Associated Press
4. **🏢 Official Websites**: Company official sites, organization homepages
5. **📖 Documentation**: Technical documentation, API references

#### Web Search Configuration

- **Default Results**: 2-3 high-quality sources per query
- **Content Limit**: ~65,000 characters per source (auto-truncated)
- **Timeout**: 20 seconds per URL scraping attempt
- **Retry Logic**: Automatic fallback for failed scrapes
- **Rate Limiting**: Respects Brave API rate limits

---

### Custom Models Management

#### List Custom Models
```http
GET /api/v1/custom-models
X-API-Key: YOUR_API_KEY
```

#### Get Specific Custom Model
```http
GET /api/v1/custom-models/coding-assistant
X-API-Key: YOUR_API_KEY
```

#### Create Custom Model
```http
POST /api/v1/custom-models
Content-Type: application/json
X-API-Key: YOUR_API_KEY

{
  "name": "My Custom Assistant",
  "description": "A specialized assistant for my use case",
  "base_model": "anthropic/claude-4-sonnet",
  "system_prompt": "You are a helpful assistant that specializes in...",
  "rate_limits": {
    "per_minute": 5,
    "per_hour": 50,
    "per_day": 200
  },
  "provider": "anthropic",
  "provider_config": {
    "temperature": 0.5,
    "max_tokens": 2000
  },
  "capabilities": ["text", "analysis"],
  "pricing": {
    "prompt": 0.003,
    "completion": 0.015
  }
}
```

#### Update Custom Model
```http
PUT /api/v1/custom-models/my-custom-assistant
Content-Type: application/json
X-API-Key: YOUR_API_KEY

{
  "system_prompt": "Updated system prompt...",
  "rate_limits": {
    "per_minute": 10,
    "per_hour": 100,
    "per_day": 500
  }
}
```

#### Delete Custom Model
```http
DELETE /api/v1/custom-models/my-custom-assistant
X-API-Key: YOUR_API_KEY
```

---

### Usage Statistics

#### Get Usage Stats
```http
GET /api/v1/usage
X-API-Key: YOUR_API_KEY
```

#### Get Model-Specific Usage
```http
GET /api/v1/usage/custom/coding-assistant
X-API-Key: YOUR_API_KEY
```

#### Reset Usage Stats
```http
DELETE /api/v1/usage
Content-Type: application/json
X-API-Key: YOUR_API_KEY

{
  "model": "custom/coding-assistant"  // Optional: specific model
}
```

---

## 🔧 Configuration

### Environment Variables

```bash
# Server
PORT=3000
NODE_ENV=development

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Database
DATABASE_PATH=./database/aiportal.db

# Provider API Keys (get real keys for actual AI responses)
OPENROUTER_API_KEY=sk-or-v1-your-openrouter-key-here
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key-here
OPENAI_API_KEY=sk-your-openai-key-here
GOOGLE_API_KEY=your-google-ai-studio-key-here

# Web Search API Key (for web search functionality)
BRAVE_API_KEY=your-brave-search-api-key-here

# CORS (optional - defaults allow local network)
CORS_ORIGINS=http://localhost:3009,http://localhost:3010
```

### Where to Get API Keys
- **OpenRouter**: https://openrouter.ai/ (Recommended - access to all models)
- **Anthropic**: https://console.anthropic.com/
- **OpenAI**: https://platform.openai.com/
- **Google AI**: https://ai.google.dev/
- **Brave Search**: https://api.search.brave.com/ (For web search functionality)

---

## 🔒 Security & Rate Limiting

### Rate Limits
- **Authentication endpoints**: 5 requests per 15 minutes per IP
- **Registration**: 3 requests per hour per IP
- **Custom models**: Configurable per model (minute/hour/day)

### Security Features
- Password requirements (8+ chars, number, special character)
- JWT token expiration and rotation
- API key hashing and secure storage
- Input validation on all endpoints
- CORS protection
- SQL injection prevention
- No conversation data storage (privacy-focused)

---

## 🚨 Error Responses

### Authentication Errors
```json
{
  "success": false,
  "error": "Invalid credentials"
}
```

### Rate Limit Errors
```json
{
  "error": {
    "message": "Rate limit exceeded for minute. Limit: 10, Current: 11",
    "type": "rate_limit_exceeded",
    "details": {
      "limitType": "minute",
      "limit": 10,
      "current": 11,
      "retryAfter": 45
    }
  }
}
```

### Validation Errors
```json
{
  "error": {
    "message": "Missing or invalid required fields: model and messages are required",
    "type": "invalid_request_error"
  }
}
```

---

## 📱 Example Usage

### JavaScript/Node.js

**Standard Chat Request:**
```javascript
const response = await fetch('http://YOUR_IP:3000/api/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'ak_your_api_key_here'
  },
  body: JSON.stringify({
    model: 'custom/coding-assistant',
    messages: [
      { role: 'user', content: 'Write a function to reverse a string' }
    ]
  })
});

const data = await response.json();
console.log(data.choices[0].message.content);
```

**Chat with Web Search:**
```javascript
const response = await fetch('http://YOUR_IP:3000/api/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'ak_your_api_key_here'
  },
  body: JSON.stringify({
    model: 'anthropic/claude-4-sonnet',
    messages: [
      { role: 'user', content: 'What are the latest AI safety developments?' }
    ],
    web_search: true
  })
});

const data = await response.json();
console.log('Response:', data.choices[0].message.content);
console.log('Sources:', data.sources);
```

**Streaming with Web Search:**
```javascript
const response = await fetch('http://YOUR_IP:3000/api/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'ak_your_api_key_here'
  },
  body: JSON.stringify({
    model: 'openai/gpt-4o',
    messages: [
      { role: 'user', content: 'Latest space exploration news' }
    ],
    web_search: true,
    stream: true
  })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  const lines = chunk.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = line.slice(6);
      if (data === '[DONE]') return;
      
      try {
        const parsed = JSON.parse(data);
        
        // Handle sources
        if (parsed.type === 'sources') {
          console.log('Sources found:', parsed.sources);
        }
        
        // Handle content
        if (parsed.choices?.[0]?.delta?.content) {
          process.stdout.write(parsed.choices[0].delta.content);
        }
      } catch (e) {
        // Skip parsing errors
      }
    }
  }
}
```

### Python

**Standard Request:**
```python
import requests

response = requests.post('http://YOUR_IP:3000/api/v1/chat/completions', 
  headers={
    'Content-Type': 'application/json',
    'X-API-Key': 'ak_your_api_key_here'
  },
  json={
    'model': 'custom/data-analyst',
    'messages': [
      {'role': 'user', 'content': 'Analyze this data trend...'}
    ]
  }
)

print(response.json()['choices'][0]['message']['content'])
```

**Request with Web Search:**
```python
import requests

response = requests.post('http://YOUR_IP:3000/api/v1/chat/completions', 
  headers={
    'Content-Type': 'application/json',
    'X-API-Key': 'ak_your_api_key_here'
  },
  json={
    'model': 'anthropic/claude-4-sonnet',
    'messages': [
      {'role': 'user', 'content': 'What is the current state of renewable energy adoption globally?'}
    ],
    'web_search': True
  }
)

result = response.json()
print('Response:', result['choices'][0]['message']['content'])
print('\nSources:')
for source in result.get('sources', []):
    print(f"- {source['title']}: {source['url']}")
```

### cURL

**Standard Request:**
```bash
curl -X POST http://YOUR_IP:3000/api/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "X-API-Key: ak_your_api_key_here" \
  -d '{
    "model": "custom/creative-writer",
    "messages": [
      {"role": "user", "content": "Write a short story about a robot"}
    ]
  }'
```

**Request with Web Search:**
```bash
curl -X POST http://YOUR_IP:3000/api/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "X-API-Key: ak_your_api_key_here" \
  -d '{
    "model": "google/gemini-2.5-pro",
    "messages": [
      {"role": "user", "content": "What are the latest cybersecurity threats in 2024?"}
    ],
    "web_search": true
  }'
```

**Streaming with Web Search:**
```bash
curl -X POST http://YOUR_IP:3000/api/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "X-API-Key: ak_your_api_key_here" \
  -H "Accept: text/event-stream" \
  -d '{
    "model": "openai/gpt-4o",
    "messages": [
      {"role": "user", "content": "Current stock market analysis"}
    ],
    "web_search": true,
    "stream": true
  }' \
  --no-buffer
```

---

## 🔍 Health Check

```http
GET /health
```

**Response:**
```json
{
  "status": "OK",
  "message": "Server is running"
}
```

---

## 🆘 Troubleshooting

### Common Issues

**"Port already in use"**
```bash
PORT=3001 npm start
```

**"Invalid API key"**
- Make sure you're using the API key (starts with `ak_`) in `X-API-Key` header
- Or use JWT token in `Authorization: Bearer` header

**"CORS error"**
- Server now allows all local network access by default
- Check if you're using the correct IP address

**"Rate limit exceeded"**
- Wait for the rate limit window to reset
- Check your usage with `GET /api/v1/usage`

**"No AI response"**
- Verify you have real API keys in your .env file
- Check server logs for provider authentication errors

**"Web search not working"**
- Ensure `BRAVE_API_KEY` is set in your .env file
- Get API key from https://api.search.brave.com/
- Check Brave API rate limits (free tier: 2,000 searches/month)
- Verify network connectivity to Brave Search API

**"Sources not appearing"**
- Web search may have failed but chat still works
- Check server logs for scraping errors
- Some websites block automated access
- Rate limits may prevent additional searches

**"Search results outdated"**
- Brave Search API provides real-time results
- Content scraping might hit cached versions
- Some sites update content gradually
- Check source timestamps in response

### Getting Help
- Check server logs for detailed error messages
- Use the health endpoint to verify server status
- Ensure your network allows connections on the server port
- Monitor Brave API usage in their dashboard

---

## 🎯 Production Deployment

For production use:
1. Set strong JWT_SECRET
2. Add real provider API keys (including BRAVE_API_KEY)
3. Configure CORS for your domain
4. Set NODE_ENV=production
5. Use HTTPS with reverse proxy (nginx)
6. Set up monitoring and logging
7. Configure database backups
8. Use process manager (PM2)
9. Monitor Brave Search API usage and upgrade plan if needed
10. Consider caching web search results to reduce API calls

**The system is production-ready with comprehensive security, monitoring, scalability, and real-time web search features!**

### 🚀 Key Features Summary

✅ **Multi-Provider AI Support**: Anthropic, OpenAI, Google Gemini, OpenRouter  
✅ **Custom Model Definitions**: Create specialized AI assistants  
✅ **Real-time Web Search**: Powered by Brave Search API  
✅ **OpenAI-Compatible API**: Drop-in replacement for OpenAI API  
✅ **Streaming Responses**: Real-time response streaming  
✅ **Source Attribution**: All web search results include sources  
✅ **Enterprise Security**: JWT auth, API keys, rate limiting  
✅ **Usage Analytics**: Track model usage and costs  
✅ **Production Ready**: Docker, PM2, monitoring support