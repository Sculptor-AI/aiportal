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
    {
      id: 'openrouter/anthropic/claude-3.5-sonnet',
      name: 'Claude 3.5 Sonnet',
      provider: 'anthropic',
      description: 'Demo model (backend fallback)',
      source: 'demo',
      capabilities: ['chat'],
      context_length: 200000
    },
    {
      id: 'openrouter/openai/gpt-4o-mini',
      name: 'GPT-4o Mini',
      provider: 'openai',
      description: 'Demo model (backend fallback)',
      source: 'demo',
      capabilities: ['chat'],
      context_length: 8000
    },
    {
      id: 'custom/fast-responder',
      name: 'Fast Responder',
      provider: 'demo',
      description: 'Local fast responder for titles',
      source: 'demo',
      capabilities: ['chat'],
      context_length: 8000
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

  try {
    const body = await c.req.json();
    const payload = { ...body, stream: true };

    const upstreamResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
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
// Image Generation Routes (Gemini)
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
    const { prompt } = await c.req.json();
    
    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      return c.json({ error: 'Prompt is required and must be a non-empty string' }, 400);
    }

    console.log(`Image generation request for: "${prompt}"`);

    // Use Gemini REST API directly (Edge-compatible)
    const MODEL_NAME = 'gemini-2.0-flash-preview-image-generation';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${apiKey}`;

    const requestBody = {
      contents: [{
        role: 'user',
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 0.8,
        topK: 32,
        topP: 1,
        maxOutputTokens: 8192,
        responseModalities: ['TEXT', 'IMAGE']
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' }
      ]
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', errorText);
      return c.json({ error: `Gemini API error: ${response.status}` }, 500);
    }

    const result = await response.json();
    
    if (!result.candidates?.[0]?.content?.parts) {
      return c.json({ error: 'Unexpected API response structure' }, 500);
    }

    const imagePart = result.candidates[0].content.parts.find(part => part.inlineData?.data);

    if (imagePart?.inlineData) {
      return c.json({
        imageData: `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`
      });
    }

    // No image found, return text if available
    const textPart = result.candidates[0].content.parts.find(p => p.text);
    return c.json({
      error: 'No image data found in response',
      responseText: textPart?.text || null
    }, 500);

  } catch (error) {
    console.error('Image generation error:', error);
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
  return env.ASSETS.fetch(`${url.origin}/index.html`);
});

// ============================================
// Export for Cloudflare Workers
// ============================================
export default app;
