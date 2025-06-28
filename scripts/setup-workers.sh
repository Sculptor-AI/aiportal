#!/bin/bash

# AI Portal Cloudflare Workers Setup Script
# This script prepares your project for deployment to Cloudflare Workers

echo "🚀 AI Portal Cloudflare Workers Setup"
echo "===================================="

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "backend" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Create backend-worker directory structure
echo "📁 Creating backend-worker directory..."
mkdir -p backend-worker/{controllers,utils,routes}
mkdir -p worker-configs

# Create backend worker package.json
echo "📦 Creating backend-worker package.json..."
cat > backend-worker/package.json << 'EOF'
{
  "name": "ai-portal-backend-worker",
  "version": "1.0.0",
  "type": "module",
  "main": "worker.js",
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy --env production"
  },
  "dependencies": {
    "@google/generative-ai": "^0.24.1",
    "itty-router": "^4.0.0"
  },
  "devDependencies": {
    "wrangler": "^3.0.0"
  }
}
EOF

# Create backend wrangler.toml
echo "⚙️  Creating backend wrangler.toml..."
cat > backend-worker/wrangler.toml << 'EOF'
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
EOF

# Create worker entry point
echo "🔧 Creating worker.js entry point..."
cat > backend-worker/worker.js << 'EOF'
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
router.options('*', handleCORS);

// 404 handler
router.all('*', () => new Response('Not Found', { status: 404 }));

export default {
  async fetch(request, env, ctx) {
    // Add env to request for access in controllers
    request.env = env;
    
    // Route the request
    const response = await router.handle(request, env, ctx)
      .catch(err => new Response(err.message, { status: 500 }));
    
    return wrapResponse(response, request);
  }
};
EOF

# Create CORS utility
echo "🔐 Creating CORS utility..."
cat > backend-worker/utils/cors.js << 'EOF'
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
  
  return allowedOrigins[0];
}
EOF

# Create formatters utility
echo "🎨 Creating formatters utility..."
cat > backend-worker/utils/formatters.js << 'EOF'
export function formatError(message, error = null) {
  const formattedError = {
    error: message,
    timestamp: new Date().toISOString()
  };
  
  if (error) {
    formattedError.details = error.message || error.toString();
    if (error.stack && process.env.NODE_ENV !== 'production') {
      formattedError.stack = error.stack;
    }
  }
  
  return formattedError;
}

export function formatResponsePacket(data, meta = {}) {
  return {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta
    }
  };
}
EOF

# Create RSS parser utility
echo "📰 Creating RSS parser utility..."
cat > backend-worker/utils/rssParser.js << 'EOF'
export async function parseRSSFeed(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; AIPortal/1.0)'
    }
  });
  
  const text = await response.text();
  
  // Parse RSS XML
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;
  
  while ((match = itemRegex.exec(text)) !== null) {
    const itemXml = match[1];
    
    const item = {
      title: extractTag(itemXml, 'title'),
      link: extractTag(itemXml, 'link'),
      description: extractTag(itemXml, 'description'),
      pubDate: extractTag(itemXml, 'pubDate'),
      contentEncoded: extractTag(itemXml, 'content:encoded'),
      mediaContent: extractMediaContent(itemXml)
    };
    
    items.push(item);
  }
  
  return { items };
}

function extractTag(xml, tagName) {
  const regex = new RegExp(`<${tagName}><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\/${tagName}>|<${tagName}>([\\s\\S]*?)<\/${tagName}>`, 'i');
  const match = xml.match(regex);
  return match ? (match[1] || match[2] || '').trim() : '';
}

function extractMediaContent(xml) {
  // Look for media:content
  const mediaMatch = xml.match(/<media:content[^>]+url=["']([^"']+)["']/i);
  if (mediaMatch) return mediaMatch[1];
  
  // Look for enclosure
  const enclosureMatch = xml.match(/<enclosure[^>]+url=["']([^"']+)["'][^>]+type=["']image/i);
  if (enclosureMatch) return enclosureMatch[1];
  
  // Look for media:thumbnail
  const thumbnailMatch = xml.match(/<media:thumbnail[^>]+url=["']([^"']+)["']/i);
  if (thumbnailMatch) return thumbnailMatch[1];
  
  return null;
}
EOF

# Create HTMLRewriter-based scraper
echo "🕷️  Creating HTML scraper utility..."
cat > backend-worker/utils/htmlScraper.js << 'EOF'
export async function scrapeHtml(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }
  
  let title = '';
  let content = [];
  let ogImage = '';
  
  const rewriter = new HTMLRewriter()
    .on('title', {
      text(text) {
        title += text.text;
      }
    })
    .on('meta[property="og:image"]', {
      element(element) {
        ogImage = element.getAttribute('content') || '';
      }
    })
    .on('p', {
      text(text) {
        if (text.text.trim()) {
          content.push(text.text.trim());
        }
      }
    })
    .on('article', {
      text(text) {
        if (text.text.trim()) {
          content.push(text.text.trim());
        }
      }
    })
    .on('main', {
      text(text) {
        if (text.text.trim() && content.length < 50) {
          content.push(text.text.trim());
        }
      }
    });
  
  await rewriter.transform(response).text();
  
  return {
    title: title.trim(),
    content: content.join('\n\n').substring(0, 65000),
    image: ogImage,
    url: response.url
  };
}
EOF

# Copy controller files and adapt them
echo "📋 Copying and adapting controllers..."
# Note: You'll need to manually adapt these files

# Create model controller
cat > backend-worker/controllers/modelController.js << 'EOF'
export const getModels = async (request, env) => {
  const models = [
    {
      id: 'chatgpt-4o',
      name: 'ChatGPT-4o',
      description: 'Latest GPT-4 Omni model with vision capabilities',
      provider: 'openai',
      capabilities: ['chat', 'vision', 'code']
    },
    {
      id: 'claude-3.7-sonnet',
      name: 'Claude 3.5 Sonnet',
      description: 'Anthropic\'s balanced model for general tasks',
      provider: 'anthropic',
      capabilities: ['chat', 'vision', 'code']
    },
    {
      id: 'gemini-2-flash',
      name: 'Gemini 2.0 Flash',
      description: 'Google\'s fast multimodal model',
      provider: 'google',
      capabilities: ['chat', 'vision']
    },
    {
      id: 'meta-llama/llama-4-maverick:free',
      name: 'Llama 4 Maverick (Free)',
      description: 'Meta\'s open-source model',
      provider: 'meta',
      capabilities: ['chat']
    }
  ];
  
  return new Response(JSON.stringify({ models }), {
    headers: { 'Content-Type': 'application/json' }
  });
};
EOF

# Update frontend wrangler.toml
echo "🎨 Updating frontend wrangler.toml..."
cat > wrangler.toml << 'EOF'
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
EOF

# Create GitHub Actions workflow
echo "🔄 Creating GitHub Actions workflow..."
mkdir -p .github/workflows
cat > .github/workflows/deploy.yml << 'EOF'
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
      
      - name: Prepare backend worker
        run: |
          chmod +x scripts/setup-workers.sh
          ./scripts/setup-workers.sh --ci
          
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
EOF

# Add CI mode to skip interactive parts
if [ "$1" != "--ci" ]; then
  echo ""
  echo "✅ Setup complete!"
  echo ""
  echo "Next steps:"
  echo "1. Install backend-worker dependencies:"
  echo "   cd backend-worker && npm install"
  echo ""
  echo "2. Copy and adapt your controllers from backend/ to backend-worker/"
  echo "   - Replace req/res with Request/Response objects"
  echo "   - Replace axios with fetch"
  echo "   - Use env instead of process.env"
  echo ""
  echo "3. Create .env.production:"
  echo "   echo 'VITE_BACKEND_URL=https://aiapi.kaileh.dev' > .env.production"
  echo ""
  echo "4. Build frontend:"
  echo "   npm run build"
  echo ""
  echo "5. Test locally:"
  echo "   cd backend-worker && wrangler dev"
  echo "   cd .. && wrangler dev"
  echo ""
  echo "6. Deploy:"
  echo "   cd backend-worker && wrangler deploy --env production"
  echo "   cd .. && wrangler deploy --env production"
  echo ""
  echo "7. Set secrets in Cloudflare dashboard:"
  echo "   - OPENROUTER_API_KEY"
  echo "   - GEMINI_API_KEY"
  echo "   - BRAVE_API_KEY"
fi 