import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();

// In-memory demo store (persists for the lifetime of the worker instance)
const state = {
  users: new Map(),
  apiKeys: new Map()
};

const nowIso = () => new Date().toISOString();

const sanitizeUser = (user) => {
  if (!user) return null;
  const { password, ...safeUser } = user;
  return safeUser;
};

const seedUsers = () => {
  if (state.users.size > 0) return;
  const seededAt = nowIso();
  const seed = [
    {
      id: 'admin-1',
      username: 'admin',
      email: 'admin@example.com',
      password: 'admin123',
      status: 'admin',
      role: 'admin'
    },
    {
      id: 'user-1',
      username: 'demo',
      email: 'demo@example.com',
      password: 'demo123',
      status: 'active',
      role: 'user'
    }
  ];
  seed.forEach((u) => {
    state.users.set(u.id, {
      ...u,
      created_at: seededAt,
      updated_at: seededAt,
      last_login: null,
      settings: { theme: 'light' }
    });
  });
};

seedUsers();

const findUserByUsername = (username) => {
  if (!username) return null;
  const target = username.toLowerCase();
  for (const user of state.users.values()) {
    if (user.username.toLowerCase() === target) return user;
  }
  return null;
};

const findUserByEmail = (email) => {
  if (!email) return null;
  const target = email.toLowerCase();
  for (const user of state.users.values()) {
    if (user.email.toLowerCase() === target) return user;
  }
  return null;
};

const createAccessToken = (userId) => `ak_local_${userId}`;
const createRefreshToken = () => `rt_local_${crypto.randomUUID()}`;
const createAdminToken = (userId) => `admin_local_${userId}_${crypto.randomUUID()}`;

const ensureApiKeyStore = (userId) => {
  if (!state.apiKeys.has(userId)) {
    state.apiKeys.set(userId, []);
  }
  return state.apiKeys.get(userId);
};

const parseBearer = (value) => {
  if (!value) return null;
  return value.startsWith('Bearer ') ? value.slice(7).trim() : value.trim();
};

const getUserFromAuth = (c) => {
  const headerAuth = parseBearer(c.req.header('Authorization'));
  const apiKey = c.req.header('X-API-Key');
  const token = headerAuth || apiKey;
  if (!token) return null;
  if (token.startsWith('ak_local_')) {
    const userId = token.replace('ak_local_', '');
    return state.users.get(userId) || null;
  }
  return null;
};

const getAdminFromAuth = (c) => {
  const token = parseBearer(c.req.header('Authorization')) || c.req.header('X-Admin-Token');
  if (!token) return null;
  if (!token.startsWith('admin_local_')) return null;
  const withoutPrefix = token.replace('admin_local_', '');
  const parts = withoutPrefix.split('_');
  const userId = parts.shift();
  return state.users.get(userId) || null;
};

// ============================================
// CORS Middleware
// ============================================
app.use('/api/*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'x-api-key']
}));

// ============================================
// Health & Models
// ============================================
app.get('/api/health', (c) => c.json({ ok: true, time: nowIso() }));

app.get('/api/models', (c) => {
  const models = [
    // === OpenAI Models (via OpenRouter) ===
    {
      id: 'openai/gpt-5.1',
      name: 'GPT-5.1',
      provider: 'openai',
      description: 'OpenAI\'s most advanced model',
      source: 'openrouter',
      capabilities: ['chat', 'vision'],
      context_length: 128000
    },
    {
      id: 'openai/gpt-5',
      name: 'GPT-5',
      provider: 'openai',
      description: 'OpenAI\'s flagship model',
      source: 'openrouter',
      capabilities: ['chat', 'vision'],
      context_length: 128000
    },
    {
      id: 'openai/gpt-5-mini',
      name: 'GPT-5 Mini',
      provider: 'openai',
      description: 'Fast and efficient GPT-5 variant',
      source: 'openrouter',
      capabilities: ['chat', 'vision'],
      context_length: 128000
    },
    {
      id: 'openai/o4-mini',
      name: 'o4 Mini',
      provider: 'openai',
      description: 'OpenAI reasoning model - fast',
      source: 'openrouter',
      capabilities: ['chat', 'reasoning'],
      context_length: 128000
    },
    {
      id: 'openai/o3',
      name: 'o3',
      provider: 'openai',
      description: 'OpenAI advanced reasoning model',
      source: 'openrouter',
      capabilities: ['chat', 'reasoning'],
      context_length: 200000
    },
    {
      id: 'openai/o3-mini',
      name: 'o3 Mini',
      provider: 'openai',
      description: 'Fast reasoning model',
      source: 'openrouter',
      capabilities: ['chat', 'reasoning'],
      context_length: 200000
    },
    // === Anthropic Models (via OpenRouter) ===
    {
      id: 'anthropic/claude-opus-4.5',
      name: 'Claude Opus 4.5',
      provider: 'anthropic',
      description: 'Anthropic\'s most intelligent model',
      source: 'openrouter',
      capabilities: ['chat', 'vision', 'reasoning'],
      context_length: 200000
    },
    {
      id: 'anthropic/claude-sonnet-4.5',
      name: 'Claude Sonnet 4.5',
      provider: 'anthropic',
      description: 'Best balance of intelligence and speed',
      source: 'openrouter',
      capabilities: ['chat', 'vision'],
      context_length: 200000
    },
    {
      id: 'anthropic/claude-sonnet-4',
      name: 'Claude Sonnet 4',
      provider: 'anthropic',
      description: 'Fast and capable Claude model',
      source: 'openrouter',
      capabilities: ['chat', 'vision'],
      context_length: 200000
    },
    {
      id: 'anthropic/claude-3.7-sonnet',
      name: 'Claude 3.7 Sonnet',
      provider: 'anthropic',
      description: 'Previous gen high-performance model',
      source: 'openrouter',
      capabilities: ['chat', 'vision'],
      context_length: 200000
    },
    // === Google Gemini Models (Direct API) ===
    {
      id: 'gemini-3-pro-preview',
      name: 'Gemini 3 Pro',
      provider: 'google',
      description: 'Google\'s most intelligent model',
      source: 'gemini',
      capabilities: ['chat', 'vision', 'search', 'reasoning'],
      context_length: 1000000
    },
    {
      id: 'gemini-2.5-flash',
      name: 'Gemini 2.5 Flash',
      provider: 'google',
      description: 'Best price-performance ratio',
      source: 'gemini',
      capabilities: ['chat', 'vision', 'search'],
      context_length: 1000000
    },
    {
      id: 'gemini-2.5-pro',
      name: 'Gemini 2.5 Pro',
      provider: 'google',
      description: 'Advanced reasoning and coding',
      source: 'gemini',
      capabilities: ['chat', 'vision', 'search', 'reasoning'],
      context_length: 1000000
    },
    {
      id: 'gemini-2.5-flash-lite',
      name: 'Gemini 2.5 Flash Lite',
      provider: 'google',
      description: 'Ultra-fast lightweight model',
      source: 'gemini',
      capabilities: ['chat', 'vision'],
      context_length: 1000000
    },
    {
      id: 'gemini-2.0-flash',
      name: 'Gemini 2.0 Flash',
      provider: 'google',
      description: 'Fast multimodal model',
      source: 'gemini',
      capabilities: ['chat', 'vision', 'search'],
      context_length: 1000000
    }
  ];
  return c.json({ models });
});

// ============================================
// Authentication (demo-friendly)
// ============================================
app.post('/api/auth/register', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const { username, password, email } = body;

  if (!username || !password || !email) {
    return c.json({ error: 'Username, password, and email are required' }, 400);
  }

  if (findUserByUsername(username)) {
    return c.json({ error: 'Username already exists' }, 409);
  }

  if (findUserByEmail(email)) {
    return c.json({ error: 'Email already exists' }, 409);
  }

  const id = crypto.randomUUID();
  const now = nowIso();
  state.users.set(id, {
    id,
    username,
    email,
    password,
    status: 'active',
    role: 'user',
    created_at: now,
    updated_at: now,
    last_login: null,
    settings: { theme: 'light' }
  });

  return c.json({ success: true, message: 'Registration successful', userId: id });
});

app.post('/api/auth/login', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const { username, password } = body;

  if (!username || !password) {
    return c.json({ error: 'Username and password are required' }, 400);
  }

  const user = findUserByUsername(username);
  if (!user || user.password !== password) {
    return c.json({ error: 'Invalid username or password' }, 401);
  }

  if (user.status === 'pending') {
    return c.json({ error: 'Account pending approval' }, 403);
  }

  user.last_login = nowIso();
  user.updated_at = nowIso();
  const accessToken = createAccessToken(user.id);
  const refreshToken = createRefreshToken();

  return c.json({
    success: true,
    data: {
      user: sanitizeUser(user),
      accessToken,
      refreshToken
    }
  });
});

app.post('/api/auth/api-keys', async (c) => {
  const user = getUserFromAuth(c);
  if (!user) {
    return c.json({ error: 'User not authenticated' }, 401);
  }
  const keys = ensureApiKeyStore(user.id);
  const key = `ak_local_${crypto.randomUUID()}`;
  keys.push({ name: `Key ${keys.length + 1}`, value: key, created_at: nowIso() });
  return c.json({ success: true, data: { key, keys } });
});

app.get('/api/auth/api-keys', (c) => {
  const user = getUserFromAuth(c);
  if (!user) {
    return c.json({ error: 'User not authenticated' }, 401);
  }
  const keys = ensureApiKeyStore(user.id);
  return c.json({ success: true, data: keys });
});

// ============================================
// Admin APIs (demo-friendly)
// ============================================
app.post('/api/admin/auth/login', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const { username, password } = body;
  const admin = findUserByUsername(username);

  if (!admin || admin.password !== password || admin.status !== 'admin') {
    return c.json({ error: 'Invalid admin credentials' }, 401);
  }

  const adminToken = createAdminToken(admin.id);
  admin.last_login = nowIso();
  admin.updated_at = nowIso();

  return c.json({
    success: true,
    data: {
      user: sanitizeUser(admin),
      adminToken
    }
  });
});

app.post('/api/admin/auth/logout', (c) => {
  return c.json({ success: true });
});

app.get('/api/admin/users', (c) => {
  const admin = getAdminFromAuth(c);
  if (!admin) {
    return c.json({ error: 'Admin authentication required' }, 401);
  }
  const users = Array.from(state.users.values()).map(sanitizeUser);
  return c.json({ success: true, data: { users } });
});

app.get('/api/admin/users/:userId', (c) => {
  const admin = getAdminFromAuth(c);
  if (!admin) {
    return c.json({ error: 'Admin authentication required' }, 401);
  }
  const userId = c.req.param('userId');
  const user = state.users.get(userId);
  if (!user) return c.json({ error: 'User not found' }, 404);
  return c.json({ success: true, data: { user: sanitizeUser(user) } });
});

app.put('/api/admin/users/:userId/status', async (c) => {
  const admin = getAdminFromAuth(c);
  if (!admin) {
    return c.json({ error: 'Admin authentication required' }, 401);
  }
  const userId = c.req.param('userId');
  const user = state.users.get(userId);
  if (!user) return c.json({ error: 'User not found' }, 404);
  const body = await c.req.json().catch(() => ({}));
  if (!body.status) return c.json({ error: 'Status is required' }, 400);
  user.status = body.status;
  user.updated_at = nowIso();
  return c.json({ success: true, data: { id: userId, status: user.status } });
});

app.put('/api/admin/users/:userId', async (c) => {
  const admin = getAdminFromAuth(c);
  if (!admin) {
    return c.json({ error: 'Admin authentication required' }, 401);
  }
  const userId = c.req.param('userId');
  const user = state.users.get(userId);
  if (!user) return c.json({ error: 'User not found' }, 404);
  const body = await c.req.json().catch(() => ({}));
  if (body.email) user.email = body.email;
  if (body.username) user.username = body.username;
  if (body.password) user.password = body.password;
  user.updated_at = nowIso();
  return c.json({ success: true, data: { user: sanitizeUser(user) } });
});

app.get('/api/admin/dashboard/stats', (c) => {
  const admin = getAdminFromAuth(c);
  if (!admin) {
    return c.json({ error: 'Admin authentication required' }, 401);
  }
  let totalUsers = 0;
  let pendingUsers = 0;
  let activeUsers = 0;
  let adminUsers = 0;
  for (const user of state.users.values()) {
    totalUsers += 1;
    if (user.status === 'pending') pendingUsers += 1;
    if (user.status === 'active') activeUsers += 1;
    if (user.status === 'admin') adminUsers += 1;
  }
  return c.json({
    success: true,
    data: {
      stats: { totalUsers, pendingUsers, activeUsers, adminUsers }
    }
  });
});

// ============================================
// RSS Feed Configuration
// ============================================
const RSS_FEEDS = {
  top: [
    'https://feeds.bbci.co.uk/news/rss.xml',
    'https://rss.cnn.com/rss/edition.rss',
    'https://feeds.reuters.com/reuters/topNews'
  ],
  tech: [
    'https://feeds.feedburner.com/TechCrunch',
    'https://www.wired.com/feed/rss',
    'https://feeds.arstechnica.com/arstechnica/index'
  ],
  sports: [
    'https://www.espn.com/espn/rss/news',
    'https://feeds.bbci.co.uk/sport/rss.xml'
  ],
  finance: [
    'https://feeds.finance.yahoo.com/rss/2.0/headline',
    'https://feeds.reuters.com/news/wealth'
  ],
  art: [
    'https://hyperallergic.com/feed/',
    'https://www.theartnewspaper.com/rss'
  ],
  tv: [
    'https://feeds.feedburner.com/variety/headlines',
    'https://ew.com/feed/'
  ],
  politics: [
    'https://feeds.reuters.com/reuters/politicsNews',
    'https://feeds.bbci.co.uk/news/politics/rss.xml'
  ]
};

const CARD_SIZES = ['featured', 'wide', 'tall', 'compact', 'standard'];

// ============================================
// RSS Helper Functions
// ============================================
function extractXMLContent(xml, tag) {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1].trim() : null;
}

function cleanText(text) {
  if (!text) return text;
  text = text.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
  text = text.replace(/<[^>]*>/g, '');
  const entityMap = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'"
  };
  text = text.replace(/&[a-z0-9#]+;/gi, match => entityMap[match] || match);
  return text.trim();
}

function extractDomain(url) {
  try {
    const domain = new URL(url).hostname;
    return domain.replace('www.', '').replace('feeds.', '');
  } catch {
    return 'Unknown';
  }
}

async function parseRSSFeed(feedUrl) {
  try {
    const response = await fetch(feedUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)' }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const xmlText = await response.text();
    const articles = [];
    const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
    let match;
    while ((match = itemRegex.exec(xmlText)) !== null) {
      const itemContent = match[1];
      const title = extractXMLContent(itemContent, 'title');
      const description = extractXMLContent(itemContent, 'description');
      const link = extractXMLContent(itemContent, 'link');
      const pubDate = extractXMLContent(itemContent, 'pubDate');
      const guid = extractXMLContent(itemContent, 'guid');
      if (title && link) {
        articles.push({
          id: guid || link,
          title: cleanText(title),
          description: cleanText(description) || '',
          url: link,
          pubDate: pubDate || new Date().toISOString(),
          source: extractDomain(feedUrl),
          image: null,
          size: CARD_SIZES[Math.floor(Math.random() * CARD_SIZES.length)]
        });
      }
    }
    return articles;
  } catch (error) {
    console.error('Error parsing RSS feed:', feedUrl, error);
    return [];
  }
}

async function fetchArticlesByCategory(category, limit = 20) {
  const feeds = RSS_FEEDS[category.toLowerCase()] || RSS_FEEDS.top;
  const promises = feeds.map(feed => parseRSSFeed(feed));
  const results = await Promise.all(promises);
  const allArticles = results.flat();
  allArticles.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
  allArticles.forEach(article => { article.category = category.toLowerCase(); });
  return allArticles.slice(0, limit);
}

async function fetchArticleContent(url) {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)' }
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  let content = await response.text();
  content = content.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  content = content.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  const paragraphRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  const paragraphs = [];
  let match;
  while ((match = paragraphRegex.exec(content)) !== null) {
    const text = cleanText(match[1]);
    if (text && text.length > 50) paragraphs.push(text);
  }
  return { content: paragraphs.join('\n\n'), extracted: true, title: null, image: null };
}

// ============================================
// RSS Routes
// ============================================
app.get('/api/rss/articles/:category', async (c) => {
  const category = c.req.param('category');
  const limit = parseInt(c.req.query('limit') || '20');
  const articles = await fetchArticlesByCategory(category, limit);
  return c.json({ articles });
});

app.get('/api/rss/articles', async (c) => {
  const limit = parseInt(c.req.query('limit') || '50');
  const allArticles = [];
  for (const category of Object.keys(RSS_FEEDS)) {
    const articles = await fetchArticlesByCategory(category, 10);
    allArticles.push(...articles);
  }
  allArticles.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
  return c.json({ articles: allArticles.slice(0, limit) });
});

app.get('/api/rss/article-content', async (c) => {
  const articleUrl = c.req.query('url');
  if (!articleUrl) {
    return c.json({ error: 'URL parameter required' }, 400);
  }
  try {
    const content = await fetchArticleContent(articleUrl);
    return c.json(content);
  } catch (error) {
    return c.json({ error: 'Failed to fetch article content' }, 500);
  }
});

// ============================================
// Chat Completion Routes (OpenRouter)
// ============================================
app.post('/api/v1/chat/completions', async (c) => {
  const env = c.env;
  const apiKey = env.OPENROUTER_API_KEY;
  const geminiKey = env.GEMINI_API_KEY;

  try {
    const body = await c.req.json();
    const modelId = body.model;

    // Route Gemini models to Google's API directly
    if (modelId && (modelId.includes('gemini') || modelId.includes('google/'))) {
      if (!geminiKey) {
        return c.json({ error: 'GEMINI_API_KEY is not configured in the backend.' }, 500);
      }
      return handleGeminiChat(c, body, geminiKey);
    }

    // Default to OpenRouter for other models
    if (!apiKey) {
      const encoder = new TextEncoder();
      const demoStream = new ReadableStream({
        start(controller) {
          const send = (payload) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
          send({ choices: [{ delta: { content: 'OpenRouter API key is not configured. ' } }] });
          send({ choices: [{ delta: { content: 'Add OPENROUTER_API_KEY in wrangler.toml to enable live responses. ' } }] });
          send({ choices: [{ delta: { content: 'This is a demo fallback response from the worker.' } }] });
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        }
      });

      return new Response(demoStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        }
      });
    }

    const payload = { ...body, stream: true };

    const upstreamResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://sculptorai.org', // Required by OpenRouter
        'X-Title': 'Sculptor AI'
      },
      body: JSON.stringify(payload)
    });

    if (!upstreamResponse.ok) {
      const errorText = await upstreamResponse.text();
      return c.json({ error: `Upstream error: ${errorText}` }, upstreamResponse.status);
    }

    // Stream the response back to the client
    return new Response(upstreamResponse.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });
  } catch (error) {
    console.error('Chat completion error:', error);
    return c.json({ error: error.message || 'Internal server error' }, 500);
  }
});

// ============================================
// Gemini API Helper
// ============================================
async function handleGeminiChat(c, body, apiKey) {
  const modelMap = {
    // Gemini 3.x
    'gemini-3-pro-preview': 'gemini-3-pro-preview',
    'gemini-3-pro-image-preview': 'gemini-3-pro-image-preview',
    // Gemini 2.5
    'gemini-2.5-flash': 'gemini-2.5-flash',
    'gemini-2.5-flash-lite': 'gemini-2.5-flash-lite',
    'gemini-2.5-pro': 'gemini-2.5-pro',
    // Gemini 2.0
    'gemini-2.0-flash': 'gemini-2.0-flash',
    'gemini-2.0-flash-lite': 'gemini-2.0-flash-lite',
    // Legacy support
    'gemini-2.0-flash-exp': 'gemini-2.0-flash',
    'gemini-1.5-pro': 'gemini-2.5-pro',
    'gemini-1.5-flash': 'gemini-2.5-flash',
    // Fallback
    'default': 'gemini-2.5-flash'
  };

  const targetModel = modelMap[body.model] || modelMap['default'];
  console.log(`Routing model ${body.model} to Google API (target: ${targetModel})`);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:streamGenerateContent?key=${apiKey}`;

  // Convert OpenAI messages to Gemini format
  const contents = [];
  let systemInstruction = null;

  // Handle system prompt if present in body or messages
  if (body.system) {
    systemInstruction = { parts: [{ text: body.system }] };
  }

  for (const msg of body.messages) {
    if (msg.role === 'system') {
      systemInstruction = { parts: [{ text: msg.content }] };
      continue;
    }

    const parts = [];
    if (typeof msg.content === 'string') {
      parts.push({ text: msg.content });
    } else if (Array.isArray(msg.content)) {
      for (const part of msg.content) {
        if (part.type === 'text') {
          parts.push({ text: part.text });
        } else if (part.type === 'image_url') {
          // Extract base64 from data URL
          const matches = part.image_url.url.match(/^data:([^;]+);base64,(.+)$/);
          if (matches) {
            parts.push({
              inlineData: {
                mimeType: matches[1],
                data: matches[2]
              }
            });
          }
        }
      }
    }

    contents.push({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: parts
    });
  }

  const geminiBody = {
    contents,
    generationConfig: {
      temperature: body.temperature || 0.7,
      maxOutputTokens: body.max_tokens || 8192
    }
  };

  if (systemInstruction) {
    geminiBody.systemInstruction = systemInstruction;
  }

  // Add search grounding if requested
  if (body.web_search) {
    geminiBody.tools = [{
      googleSearch: {}
    }];
  }

  console.log('Sending request to Gemini:', JSON.stringify(geminiBody, null, 2));

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API Error:', errorText);
      return c.json({ error: `Gemini API Error: ${errorText}` }, response.status);
    }

    // Set up streaming response compatible with OpenAI client
    const encoder = new TextEncoder();
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        let buffer = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            // Gemini stream returns a JSON array, one object at a time or bracketed
            // We need to parse valid JSON objects from the buffer
            // Simple heuristic: look for object boundaries since Gemini API returns a list of JSON objects
            // Actually, REST stream format for Gemini is `[{...},\r\n{...}]`

            // Clean up the buffer to parse JSON objects
            // This is a naive parser for the Gemini stream array
            let bracketLevel = 0;
            let inString = false;
            let start = 0;

            for (let i = 0; i < buffer.length; i++) {
              const char = buffer[i];

              if (char === '"' && buffer[i - 1] !== '\\') {
                inString = !inString;
              }

              if (!inString) {
                if (char === '{') {
                  if (bracketLevel === 0) start = i;
                  bracketLevel++;
                } else if (char === '}') {
                  bracketLevel--;
                  if (bracketLevel === 0) {
                    const jsonStr = buffer.substring(start, i + 1);
                    try {
                      const data = JSON.parse(jsonStr);
                      // Process Gemini chunk to OpenAI format
                      const chunkText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
                      const groundingMetadata = data.candidates?.[0]?.groundingMetadata;

                      // Send text content
                      if (chunkText) {
                        const openAIChunk = {
                          choices: [{
                            delta: { content: chunkText },
                            finish_reason: null
                          }]
                        };
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify(openAIChunk)}\n\n`));
                      }

                      // Handle grounding sources (send as a special chunk or append to text)
                      if (groundingMetadata?.groundingChunks) {
                        // We can construct a sources block similar to what the frontend expects
                        const sources = groundingMetadata.groundingChunks
                          .map((chunk, idx) => chunk.web ? {
                            title: chunk.web.title || `Source ${idx + 1}`,
                            url: chunk.web.uri
                          } : null)
                          .filter(Boolean);

                        if (sources.length > 0) {
                          // Send sources in a format the frontend parser might understand
                          // or just append them as text if the frontend doesn't utilize specific event types yet.
                          // For now, let's inject a special "sources" event
                          const sourceEvent = {
                            type: 'sources',
                            sources: sources
                          };
                          controller.enqueue(encoder.encode(`data: ${JSON.stringify(sourceEvent)}\n\n`));
                        }
                      }

                      // Handle search entry point (HTML for Google Search results)
                      if (groundingMetadata?.searchEntryPoint?.renderedContent) {
                        // This is usually HTML that Google requires you to display
                        // We can send it as a separate debug chunk or similar
                      }

                    } catch (e) {
                      // Ignore parse errors for partial chunks
                    }
                    // Advance buffer
                    buffer = buffer.substring(i + 1);
                    i = -1; // Reset loop for new buffer
                    start = 0;
                  }
                }
              }
            }
          }
        } catch (err) {
          console.error('Stream processing error:', err);
          const errorChunk = { error: { message: 'Stream processing failed' } };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorChunk)}\n\n`));
        } finally {
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });

  } catch (error) {
    console.error('Gemini handler error:', error);
    return c.json({ error: error.message }, 500);
  }
}

// ============================================
// Image Generation Routes (Imagen 4)
// ============================================
app.post('/api/image/generate', async (c) => {
  const env = c.env;
  const apiKey = env.GEMINI_API_KEY;

  if (!apiKey) {
    const placeholder = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMB/6XBrZkAAAAASUVORK5CYII=';
    return c.json({
      imageData: placeholder,
      note: 'GEMINI_API_KEY is not configured. Returning placeholder image.'
    });
  }

  try {
    const { prompt, model, aspectRatio, imageSize } = await c.req.json();

    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      return c.json({ error: 'Prompt is required and must be a non-empty string' }, 400);
    }

    console.log(`Image generation request for: "${prompt}"`);

    // Model priority: user-specified > Imagen 4 Fast > Imagen 3
    const IMAGEN_MODELS = [
      model || 'imagen-4.0-fast-generate-001',
      'imagen-4.0-generate-001',
      'imagen-3.0-generate-001'
    ];

    const requestBody = {
      instances: [{
        prompt: prompt
      }],
      parameters: {
        sampleCount: 1,
        aspectRatio: aspectRatio || '1:1',
        // For fast model, disable enhanced prompts for complex prompts
        ...(model === 'imagen-4.0-fast-generate-001' && { enhancePrompt: false })
      }
    };

    // Add imageSize if specified (1K or 2K)
    if (imageSize) {
      requestBody.parameters.imageSize = imageSize;
    }

    let response = null;
    let lastError = null;

    // Try each model in order until one succeeds
    for (const modelName of IMAGEN_MODELS) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:predict?key=${apiKey}`;

      console.log(`Trying Imagen model: ${modelName}`);

      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        console.log(`Success with model: ${modelName}`);
        break;
      } else {
        lastError = await response.text();
        console.log(`Model ${modelName} failed: ${lastError}`);
        response = null; // Reset for next iteration
      }
    }

    if (!response || !response.ok) {
      console.error('All Imagen models failed. Last error:', lastError);
      return c.json({
        error: 'Image generation failed with all available models',
        details: lastError
      }, 500);
    }

    const result = await response.json();

    // Handle Imagen 3/4 response format
    // Structure: { predictions: [ { bytesBase64Encoded: "...", mimeType: "..." } ] }
    if (result.predictions && result.predictions[0]) {
      const prediction = result.predictions[0];

      if (prediction.bytesBase64Encoded) {
        const mimeType = prediction.mimeType || 'image/png';
        return c.json({
          imageData: `data:${mimeType};base64,${prediction.bytesBase64Encoded}`
        });
      }
    }

    return c.json({
      error: 'Unexpected API response structure',
      details: result
    }, 500);

  } catch (error) {
    console.error('Image generation error:', error);
    return c.json({ error: error.message || 'Internal server error' }, 500);
  }
});

// ============================================
// Video Generation Routes (Veo 2)
// Veo 2 uses long-running operations - requires polling
// ============================================

// Helper function to poll for operation completion
async function pollVeoOperation(operationName, apiKey, maxAttempts = 60) {
  const pollUrl = `https://generativelanguage.googleapis.com/v1beta/${operationName}?key=${apiKey}`;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    console.log(`Polling Veo operation (attempt ${attempt + 1}/${maxAttempts}): ${operationName}`);

    const response = await fetch(pollUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to poll operation: ${response.status} - ${errorText}`);
    }

    const operation = await response.json();

    if (operation.done) {
      console.log('Veo operation completed');
      return operation;
    }

    // Wait 5 seconds before polling again (video generation takes time)
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  throw new Error('Video generation timed out after maximum polling attempts');
}

app.post('/api/video/generate', async (c) => {
  const env = c.env;
  const apiKey = env.GEMINI_API_KEY;

  if (!apiKey) {
    return c.json({ error: 'GEMINI_API_KEY is not configured.' }, 500);
  }

  try {
    const { prompt, aspectRatio, duration } = await c.req.json();

    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      return c.json({ error: 'Prompt is required and must be a non-empty string' }, 400);
    }

    console.log(`Video generation request for: "${prompt}"`);

    // Veo 2 uses predictLongRunning endpoint for async video generation
    const MODEL_NAME = 'veo-2.0-generate-001';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:predictLongRunning?key=${apiKey}`;

    const requestBody = {
      instances: [{
        prompt: prompt
      }],
      parameters: {
        // Veo 2 supports: 720p resolution, 5-8 second clips
        aspectRatio: aspectRatio || '16:9',
        // Duration in seconds (5-8 for Veo 2)
        ...(duration && { durationSeconds: Math.min(Math.max(duration, 5), 8) })
      }
    };

    console.log('Starting Veo 2 video generation...');

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Veo API error:', errorText);
      return c.json({ error: `Veo API error: ${response.status}`, details: errorText }, 500);
    }

    const operationResult = await response.json();

    // Veo returns a long-running operation object with a name
    if (!operationResult.name) {
      console.error('No operation name in Veo response:', operationResult);
      return c.json({
        error: 'Unexpected API response - no operation name',
        details: operationResult
      }, 500);
    }

    console.log(`Veo operation started: ${operationResult.name}`);

    // Poll for completion
    const completedOperation = await pollVeoOperation(operationResult.name, apiKey);

    // Handle errors in the completed operation
    if (completedOperation.error) {
      console.error('Veo operation error:', completedOperation.error);
      return c.json({
        error: 'Video generation failed',
        details: completedOperation.error
      }, 500);
    }

    // Extract video from the response
    // Response structure: { response: { generatedVideos: [ { video: { uri: "..." } } ] } }
    const generatedVideos = completedOperation.response?.generatedVideos ||
                           completedOperation.result?.generatedVideos ||
                           completedOperation.response?.predictions;

    if (generatedVideos && generatedVideos.length > 0) {
      const video = generatedVideos[0];

      // Check for video URI (GCS or HTTP URL)
      if (video.video?.uri || video.videoUri) {
        return c.json({
          videoUrl: video.video?.uri || video.videoUri
        });
      }

      // Check for base64 encoded video data
      if (video.bytesBase64Encoded || video.video?.bytesBase64Encoded) {
        const videoData = video.bytesBase64Encoded || video.video?.bytesBase64Encoded;
        const mimeType = video.mimeType || video.video?.mimeType || 'video/mp4';
        return c.json({
          videoData: `data:${mimeType};base64,${videoData}`
        });
      }
    }

    return c.json({
      error: 'No video data found in response',
      details: completedOperation
    }, 500);

  } catch (error) {
    console.error('Video generation error:', error);
    return c.json({ error: error.message || 'Internal server error' }, 500);
  }
});

// ============================================
// Static Assets & SPA Fallback
// ============================================
app.get('*', async (c) => {
  const url = new URL(c.req.url);
  const env = c.env;

  // Check if this is a request for a static asset
  if (url.pathname.startsWith('/assets/') ||
    url.pathname.startsWith('/images/') ||
    url.pathname.includes('.')) {
    return env.ASSETS.fetch(c.req.raw);
  }

  // For all other requests, serve index.html to handle client-side routing
  if (env.ASSETS) {
    return env.ASSETS.fetch(`${url.origin}/index.html`);
  }
  return c.text('Backend is running. API endpoints are available at /api/*', 200);
});

// ============================================
// Export for Cloudflare Workers
// ============================================
export default app;
