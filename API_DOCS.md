# AI Portal Backend - API Documentation

## 🚀 Overview

The AI Portal Backend is a secure, scalable "Routerbox" system that provides OpenAI-compatible API endpoints while supporting multiple AI providers (Anthropic, OpenAI, Google Gemini, OpenRouter) and custom model definitions.

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

**Available Models:**

**Custom Models:**
- `custom/coding-assistant` - Programming specialist (Claude Sonnet)
- `custom/creative-writer` - Creative writing assistant (Claude Opus)
- `custom/data-analyst` - Data analysis expert (GPT-4o)
- `custom/fast-responder` - Quick responses (Gemini Flash)

**Direct Provider Models:**
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

# CORS (optional - defaults allow local network)
CORS_ORIGINS=http://localhost:3009,http://localhost:3010
```

### Where to Get API Keys
- **OpenRouter**: https://openrouter.ai/ (Recommended - access to all models)
- **Anthropic**: https://console.anthropic.com/
- **OpenAI**: https://platform.openai.com/
- **Google AI**: https://ai.google.dev/

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

### Python
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

### cURL
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

### Getting Help
- Check server logs for detailed error messages
- Use the health endpoint to verify server status
- Ensure your network allows connections on the server port

---

## 🎯 Production Deployment

For production use:
1. Set strong JWT_SECRET
2. Add real provider API keys
3. Configure CORS for your domain
4. Set NODE_ENV=production
5. Use HTTPS with reverse proxy (nginx)
6. Set up monitoring and logging
7. Configure database backups
8. Use process manager (PM2)

**The system is production-ready with comprehensive security, monitoring, and scalability features!**