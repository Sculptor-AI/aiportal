# Cloudflare Workers Deployment Plan for AI Portal

## Overview

This plan outlines the deployment of the AI Portal application to Cloudflare Workers with:
- **Backend Worker**: Express.js API converted to work on Cloudflare Workers at `aiapi.kaileh.dev`
- **Frontend Worker**: React SPA served from Cloudflare Workers at `ai.kaileh.dev`
- **Secrets Management**: API keys stored securely in Cloudflare Workers secrets
- **Automatic Deployment**: GitHub Actions integration for continuous deployment

## Architecture

```
┌─────────────────────┐     ┌─────────────────────┐
│  Frontend Worker    │────▶│   Backend Worker    │
│ (React SPA)         │     │  (Express API)      │
│ ai.kaileh.dev       │     │  aiapi.kaileh.dev   │
└─────────────────────┘     └─────────────────────┘
                                      │
                            ┌─────────▼─────────────┐
                            │  External APIs       │
                            │  - OpenRouter        │
                            │  - Google Gemini     │
                            │  - Brave Search      │
                            └─────────────────────┘
```

## Prerequisites

1. **Cloudflare Account** with Workers enabled
2. **Wrangler CLI** installed (`npm install -g wrangler`)
3. **Node.js** (v18 or higher)
4. **Git** for version control

## Phase 1: Backend Worker Setup

### Step 1.1: Create Backend Worker Structure

```bash
# Create a new directory for the backend worker
mkdir backend-worker
cd backend-worker

# Copy backend files
cp -r ../backend/* .
```

### Step 1.2: Install Worker-Compatible Dependencies

Create a new `package.json` for the worker:

```json
{
  "name": "ai-portal-backend-worker",
  "version": "1.0.0",
  "type": "module",
  "main": "worker.js",
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy"
  },
  "dependencies": {
    "@google/generative-ai": "^0.24.1",
    "itty-router": "^4.0.0",
    "html-rewriter": "^1.0.0"
  },
  "devDependencies": {
    "wrangler": "^3.0.0"
  }
}
```

### Step 1.3: Create Worker Entry Point

Create `worker.js` to replace Express with Workers-compatible code:

```javascript
import { Router } from 'itty-router';
import { handleCORS, wrapResponse } from './utils/cors.js';
import { completeChat, streamChat } from './controllers/chatController.js';
import { getModels } from './controllers/modelController.js';
import { searchWeb, scrapeUrl, searchAndProcess } from './controllers/searchController.js';
import { generateImage } from './controllers/imageGenerationController.js';
import { getFeed } from './controllers/rssController.js';

const router = Router();

// Health check
router.get('/health', () => 
  new Response(JSON.stringify({ status: 'OK', message: 'Server is running' }), {
    headers: { 'Content-Type': 'application/json' }
  })
);

// API routes
router.get('/api/models', getModels);
router.post('/api/chat', completeChat);
router.post('/api/chat/stream', streamChat);
router.post('/api/search', searchWeb);
router.post('/api/scrape', scrapeUrl);
router.post('/api/search-process', searchAndProcess);
router.post('/api/v1/images/generate', generateImage);
router.get('/api/rss/feed', getFeed);

// Handle OPTIONS for CORS
router.options('*', () => new Response(null, { status: 204 }));

// 404 handler
router.all('*', () => new Response('Not Found', { status: 404 }));

export default {
  async fetch(request, env, ctx) {
    // Add env to request for access in controllers
    request.env = env;
    
    // Handle CORS
    if (request.method === 'OPTIONS') {
      return handleCORS(request);
    }
    
    // Route the request
    const response = await router.handle(request, env, ctx);
    return wrapResponse(response, request);
  }
};
```

### Step 1.4: Create Backend wrangler.toml

```toml
name = "ai-portal-backend"
main = "worker.js"
compatibility_date = "2024-01-01"

[env.production]
vars = { 
  ALLOWED_MODELS = "openai/gpt-4o,anthropic/claude-3-sonnet,google/gemini-pro-1.5,meta-llama/llama-4-scout,deepseek/deepseek-chat-v3-0324:free,nvidia/llama-3.3-nemotron-super-49b-v1",
  ALLOWED_ORIGINS = "https://ai.kaileh.dev,http://localhost:3009,http://localhost:3010"
}

[env.production.routes]
pattern = "aiapi.kaileh.dev/*"
zone_name = "kaileh.dev"

# Define secrets (to be set via CLI or dashboard)
# wrangler secret put OPENROUTER_API_KEY --env production
# wrangler secret put GEMINI_API_KEY --env production
# wrangler secret put BRAVE_API_KEY --env production
```

### Step 1.5: Create CORS Utility

Create `utils/cors.js`:

```javascript
export function handleCORS(request) {
  const headers = {
    'Access-Control-Allow-Origin': getAllowedOrigin(request),
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
  
  return new Response(null, { status: 204, headers });
}

export function wrapResponse(response, request) {
  const newHeaders = new Headers(response.headers);
  newHeaders.set('Access-Control-Allow-Origin', getAllowedOrigin(request));
  newHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  newHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  });
}

function getAllowedOrigin(request) {
  const origin = request.headers.get('Origin');
  const allowedOrigins = [
    'https://ai.kaileh.dev',
    'http://localhost:3009',
    'http://localhost:3010'
  ];
  
  if (allowedOrigins.includes(origin)) {
    return origin;
  }
  
  return allowedOrigins[0]; // Default to production origin
}
```

### Step 1.6: Adapt Controllers for Workers

Example conversion for `chatController.js`:

```javascript
// Replace Express req/res with Workers Request/Response
export const completeChat = async (request, env) => {
  try {
    const body = await request.json();
    const { modelType, prompt, search = false, deepResearch = false, imageGen = false, imageData = null, mode, systemPrompt } = body;
    
    // Validate inputs
    if (!prompt && !imageData) {
      return new Response(JSON.stringify({ error: "No content provided to send." }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Check allowed models
    const allowedModels = env.ALLOWED_MODELS?.split(',') || [];
    if (mode !== 'instant' && !allowedModels.includes(modelType)) {
      return new Response(JSON.stringify({ error: 'Invalid model type requested' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Rest of the logic, replacing axios with fetch
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://ai.kaileh.dev',
        'X-Title': 'AI Portal'
      },
      body: JSON.stringify(openRouterPayload)
    });
    
    const data = await response.json();
    
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error in chat completion:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to complete chat request',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// Streaming example with TransformStream
export const streamChat = async (request, env) => {
  const body = await request.json();
  
  // Create a TransformStream for SSE
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();
  
  // Start streaming in the background
  streamResponse(body, env, writer, encoder).catch(console.error);
  
  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
};

async function streamResponse(body, env, writer, encoder) {
  try {
    // Make request to OpenRouter with streaming
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ...payload, stream: true })
    });
    
    const reader = response.body.getReader();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      // Forward the chunk to the client
      await writer.write(value);
    }
  } finally {
    await writer.close();
  }
}
```

### Step 1.7: RSS Parser Alternative

Create `utils/rssParser.js` for Workers:

```javascript
export async function parseRSSFeed(url) {
  const response = await fetch(url);
  const text = await response.text();
  
  // Simple XML parsing for RSS
  const parser = new DOMParser();
  const xml = parser.parseFromString(text, 'text/xml');
  
  const items = [];
  const itemNodes = xml.querySelectorAll('item');
  
  itemNodes.forEach(node => {
    items.push({
      title: node.querySelector('title')?.textContent || '',
      link: node.querySelector('link')?.textContent || '',
      description: node.querySelector('description')?.textContent || '',
      pubDate: node.querySelector('pubDate')?.textContent || '',
      // Extract media content
      mediaContent: extractMediaContent(node)
    });
  });
  
  return { items };
}

function extractMediaContent(node) {
  // Look for media:content or enclosure tags
  const mediaContent = node.querySelector('media\\:content, content');
  if (mediaContent) {
    return mediaContent.getAttribute('url');
  }
  
  const enclosure = node.querySelector('enclosure');
  if (enclosure && enclosure.getAttribute('type')?.startsWith('image/')) {
    return enclosure.getAttribute('url');
  }
  
  return null;
}
```

### Step 1.8: Deploy Backend Worker

```bash
# Login to Cloudflare
wrangler login

# Set secrets via dashboard or CLI
wrangler secret put OPENROUTER_API_KEY --env production
# Enter: xxxx when prompted

wrangler secret put GEMINI_API_KEY --env production
# Enter: xxxx when prompted

wrangler secret put BRAVE_API_KEY --env production
# Enter: xxxx when prompted

# Deploy to production
wrangler deploy --env production
```

## Phase 2: Frontend Worker Setup

### Step 2.1: Update Frontend Configuration

Create `.env.production`:

```env
VITE_BACKEND_URL=https://aiapi.kaileh.dev
```

Update `src/services/aiService.js`:

```javascript
// Add at the top of the file
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

// Update API calls
const buildApiUrl = (endpoint) => {
  return `${BACKEND_URL}${endpoint}`;
};
```

### Step 2.2: Build Frontend

```bash
# Return to main project directory
cd ..

# Install dependencies
npm install

# Build for production
npm run build
```

### Step 2.3: Create Frontend wrangler.toml

```toml
name = "ai-portal-frontend"
main = "./worker.js"
compatibility_date = "2024-01-01"

[site]
bucket = "./dist"

[env.production]
vars = { 
  BACKEND_URL = "https://aiapi.kaileh.dev"
}

[env.production.routes]
pattern = "ai.kaileh.dev/*"
zone_name = "kaileh.dev"

# Enable SPA routing
[[rules]]
path = "/*"
try_files = ["/$1", "/index.html"]
```

### Step 2.4: Update Frontend Worker

Update `worker.js`:

```javascript
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // For API calls during development
    if (url.pathname.startsWith('/api/')) {
      const backendUrl = new URL(url.pathname, env.BACKEND_URL);
      backendUrl.search = url.search;
      
      return fetch(backendUrl, {
        method: request.method,
        headers: request.headers,
        body: request.body
      });
    }
    
    try {
      // Try to serve the requested path
      return await env.ASSETS.fetch(request);
    } catch (e) {
      // If not found, serve index.html for SPA routing
      const indexUrl = new URL('/index.html', request.url);
      return env.ASSETS.fetch(new Request(indexUrl, request));
    }
  }
};
```

### Step 2.5: Deploy Frontend Worker

```bash
# Deploy frontend
wrangler deploy --env production
```

## Phase 3: GitHub Actions Deployment

### Step 3.1: Create GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloudflare Workers

on:
  push:
    branches:
      - main
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build frontend
        run: npm run build
        env:
          VITE_BACKEND_URL: https://aiapi.kaileh.dev
          
      - name: Deploy Backend Worker
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CF_API_TOKEN }}
          workingDirectory: backend-worker
          environment: production
          command: deploy
          
      - name: Deploy Frontend Worker
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CF_API_TOKEN }}
          environment: production
          command: deploy
```

### Step 3.2: Setup GitHub Secrets

1. Go to your GitHub repository
2. Navigate to Settings → Secrets and variables → Actions
3. Add new repository secret:
   - Name: `CF_API_TOKEN`
   - Value: Your Cloudflare API token (create at https://dash.cloudflare.com/profile/api-tokens)

### Step 3.3: Backend Worker Preparation Script

Create `scripts/prepare-backend-worker.sh`:

```bash
#!/bin/bash

# Create backend-worker directory if it doesn't exist
mkdir -p backend-worker

# Copy backend files
cp -r backend/* backend-worker/

# Copy worker-specific files
cp worker-configs/backend-worker.js backend-worker/worker.js
cp worker-configs/backend-wrangler.toml backend-worker/wrangler.toml
cp -r worker-configs/utils backend-worker/

# Create package.json for worker
cat > backend-worker/package.json << EOF
{
  "name": "ai-portal-backend-worker",
  "version": "1.0.0",
  "type": "module",
  "main": "worker.js",
  "dependencies": {
    "@google/generative-ai": "^0.24.1",
    "itty-router": "^4.0.0"
  }
}
EOF

# Install dependencies
cd backend-worker
npm install
```

## Phase 4: Testing & Verification

### Step 4.1: Test Backend Endpoints

```bash
# Test health check
curl https://aiapi.kaileh.dev/health

# Test models endpoint
curl https://aiapi.kaileh.dev/api/models

# Test chat (with API key set)
curl -X POST https://aiapi.kaileh.dev/api/chat \
  -H "Content-Type: application/json" \
  -d '{"modelType": "meta-llama/llama-4-maverick:free", "prompt": "Hello"}'
```

### Step 4.2: Test Frontend

1. Visit https://ai.kaileh.dev
2. Check browser console for errors
3. Test chat functionality
4. Test image generation
5. Test RSS feeds

### Step 4.3: Monitor Performance

1. Go to Cloudflare Dashboard → Workers & Pages
2. Select your workers
3. View Analytics tab for:
   - Request count
   - Error rate
   - Response times

## Migration Checklist

- [x] Domain configuration (ai.kaileh.dev / aiapi.kaileh.dev)
- [ ] Backend worker created and deployed
- [ ] Frontend worker created and deployed
- [ ] Secrets configured in Cloudflare dashboard
- [ ] GitHub Actions workflow setup
- [ ] API endpoints tested
- [ ] Frontend functionality verified
- [ ] Custom domains configured
- [ ] SSL certificates active
- [ ] CORS working correctly
- [ ] Streaming responses functional

## Specific Implementation Notes

### Library Replacements

1. **RSS Parser** → Native XML parsing with DOMParser
2. **Cheerio** → HTMLRewriter API for scraping
3. **Axios** → Native fetch API
4. **Express** → itty-router
5. **dotenv** → Workers env bindings

### API Keys to Configure

Set these in Cloudflare Dashboard → Workers & Pages → Your Worker → Settings → Variables:

- `OPENROUTER_API_KEY`: xxxx
- `GEMINI_API_KEY`: xxxx  
- `BRAVE_API_KEY`: xxxx

### Cost Estimation (Free Tier)

- **Workers Free Tier**: 100,000 requests/day ✓
- **Workers KV**: Not needed (local storage only) ✓
- **Bandwidth**: 10 GB/month included ✓

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Check allowed origins in `backend-worker/wrangler.toml`
   - Verify CORS utility is properly handling requests

2. **Streaming Not Working**
   - Ensure TransformStream is properly implemented
   - Check response headers for SSE

3. **API Key Errors**
   - Verify secrets are set in Cloudflare dashboard
   - Check secret names match exactly

4. **Build Failures**
   - Ensure all dependencies are Workers-compatible
   - Check for Node.js-specific APIs

## Next Steps

1. Clone repository and create `backend-worker` directory structure
2. Implement Workers-compatible controllers
3. Test locally with `wrangler dev`
4. Deploy to production
5. Configure GitHub Actions for automatic deployment
6. Monitor and optimize based on usage 