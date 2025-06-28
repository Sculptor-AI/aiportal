# Controller Adaptation Guide for Cloudflare Workers

This guide helps you manually convert Express.js controllers to Cloudflare Workers format.

## Key Differences

### Express.js → Workers

| Express.js | Cloudflare Workers |
|------------|-------------------|
| `req.body` | `await request.json()` |
| `req.query` | `new URL(request.url).searchParams` |
| `req.params` | Extract from URL path manually |
| `res.json(data)` | `new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } })` |
| `res.status(404)` | `new Response(..., { status: 404 })` |
| `axios` | `fetch()` |
| `process.env.VAR` | `env.VAR` |

## Controller Templates

### 1. Image Generation Controller

```javascript
// backend-worker/controllers/imageGenerationController.js
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

const MODEL_NAME = "gemini-2.0-flash-preview-image-generation";

const generationConfig = {
  temperature: 0.8,
  topK: 32,
  topP: 1,
  maxOutputTokens: 8192,
};

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

export async function generateImage(request, env) {
  const API_KEY = env.GEMINI_API_KEY;
  
  if (!API_KEY) {
    return new Response(JSON.stringify({ error: "API Key for image generation service is not configured." }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await request.json();
    const { prompt } = body;
    
    if (!prompt || typeof prompt !== 'string' || prompt.trim() === "") {
      return new Response(JSON.stringify({ error: "Prompt is required and must be a non-empty string." }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log(`Image generation request for: "${prompt}"`);
    const parts = [{ text: prompt }];

    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const result = await model.generateContent({
      contents: [{ role: "user", parts }],
      generationConfig: {
        ...generationConfig,
        responseModalities: ["TEXT", "IMAGE"]
      },
      safetySettings,
    });
    
    const response = result.response;
    const imagePart = response.candidates[0].content.parts.find(part => part.inlineData && part.inlineData.data);

    if (imagePart && imagePart.inlineData) {
      return new Response(JSON.stringify({
        imageData: `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      return new Response(JSON.stringify({ 
        error: "No image data found in the generated response.",
        details: "The model may have returned text or an unexpected format."
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error("Error in generateImage controller:", error);
    return new Response(JSON.stringify({ 
      error: "Failed to generate image due to an internal server error.",
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
```

### 2. Search Controller

```javascript
// backend-worker/controllers/searchController.js
import { formatError } from '../utils/formatters.js';
import { scrapeHtml } from '../utils/htmlScraper.js';

export const searchWeb = async (request, env) => {
  try {
    const body = await request.json();
    const { query, max_results = 5 } = body;
    
    if (!query || typeof query !== 'string') {
      return new Response(JSON.stringify(formatError('Query is required and must be a string')), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const BRAVE_API_KEY = env.BRAVE_API_KEY;
    
    if (!BRAVE_API_KEY) {
      return new Response(JSON.stringify(formatError('Brave Search API key is not configured')), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const brave_api_endpoint = "https://api.search.brave.com/res/v1/web/search";
    
    const url = new URL(brave_api_endpoint);
    url.searchParams.set('q', query);
    url.searchParams.set('count', max_results);
    
    const response = await fetch(url, {
      headers: {
        "Accept": "application/json",
        "Accept-Encoding": "gzip",
        "X-Subscription-Token": BRAVE_API_KEY
      }
    });
    
    if (!response.ok) {
      throw new Error(`Brave API error: ${response.status}`);
    }
    
    const data = await response.json();
    const searchResultsRaw = data?.web?.results || [];
    
    const results = searchResultsRaw.slice(0, max_results).map(item => ({
      title: item.title || 'N/A',
      url: item.url,
      snippet: item.description || ''
    }));
    
    return new Response(JSON.stringify({ results }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Search error:', error);
    return new Response(JSON.stringify(formatError('Failed to perform search', error)), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const scrapeUrl = async (request, env) => {
  try {
    const body = await request.json();
    const { url } = body;
    
    if (!url || typeof url !== 'string') {
      return new Response(JSON.stringify(formatError('URL is required and must be a string')), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    console.log(`Attempting to scrape URL: ${url}`);
    
    // Use the HTMLRewriter-based scraper
    const scrapedData = await scrapeHtml(url);
    
    return new Response(JSON.stringify({
      url: scrapedData.url,
      title: scrapedData.title,
      content: scrapedData.content,
      length: scrapedData.content.length
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Scraping error:', error);
    return new Response(JSON.stringify(formatError('Failed to scrape URL', error)), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const searchAndProcess = async (request, env) => {
  try {
    const body = await request.json();
    const { query, max_results = 2, model_prompt, modelType = 'meta-llama/llama-4-maverick:free' } = body;
    
    if (!query || !model_prompt) {
      return new Response(JSON.stringify(formatError('Query and model_prompt are required')), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Step 1: Search
    const searchRequest = new Request(request.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, max_results: 5 })
    });
    
    const searchResponse = await searchWeb(searchRequest, env);
    const searchData = await searchResponse.json();
    
    if (!searchData.results || searchData.results.length === 0) {
      return new Response(JSON.stringify(formatError('No search results found')), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Step 2: Filter and scrape
    const filteredResults = searchData.results.slice(0, max_results);
    const scrapedContents = [];
    
    for (const result of filteredResults) {
      try {
        const scrapeRequest = new Request(request.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: result.url })
        });
        
        const scrapeResponse = await scrapeUrl(scrapeRequest, env);
        const scrapeData = await scrapeResponse.json();
        
        scrapedContents.push({
          title: result.title,
          url: result.url,
          content: scrapeData.content?.substring(0, 65000) || ''
        });
      } catch (error) {
        console.error(`Error scraping ${result.url}:`, error);
      }
    }
    
    // Step 3: Process with AI
    const formattedContent = scrapedContents.map(item => 
      `SOURCE: ${item.title} (${item.url})\n\n${item.content}`
    ).join('\n\n---\n\n');
    
    const systemPrompt = `You are a helpful assistant that synthesizes information from web search results.`;
    const finalPrompt = `SEARCH QUERY: ${query}\n\nSEARCH RESULTS:\n${formattedContent}\n\n${model_prompt}`;
    
    // Call chat endpoint
    const chatRequest = new Request(request.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        modelType: modelType,
        prompt: finalPrompt,
        systemPrompt: systemPrompt,
        search: false
      })
    });
    
    const { completeChat } = await import('./chatController.js');
    const chatResponse = await completeChat(chatRequest, env);
    const responseData = await chatResponse.json();
    
    // Add sources
    responseData.sources = filteredResults.map(source => ({
      title: source.title,
      url: source.url
    }));
    
    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Search and process error:', error);
    return new Response(JSON.stringify(formatError('Failed to search and process results', error)), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
```

### 3. RSS Controller

```javascript
// backend-worker/controllers/rssController.js
import { parseRSSFeed } from '../utils/rssParser.js';

// Simple in-memory cache (Workers have ephemeral storage)
const cache = new Map();
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

const RSS_FEEDS = {
  tech: [
    { url: 'https://feeds.feedburner.com/TechCrunch/', source: 'TechCrunch' },
    { url: 'https://www.wired.com/feed/rss', source: 'Wired' },
    { url: 'https://feeds.arstechnica.com/arstechnica/index', source: 'Ars Technica' }
  ],
  sports: [
    { url: 'https://www.espn.com/espn/rss/news', source: 'ESPN' },
    { url: 'https://rss.nytimes.com/services/xml/rss/nyt/Sports.xml', source: 'NY Times Sports' }
  ],
  // ... other categories
};

export const getFeed = async (request, env) => {
  try {
    const url = new URL(request.url);
    const category = url.searchParams.get('category') || 'tech';
    const limit = parseInt(url.searchParams.get('limit') || '10');
    
    // Check cache
    const cacheKey = `articles-${category}-${limit}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return new Response(JSON.stringify(cached.data), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Validate category
    if (!RSS_FEEDS[category] && category !== 'top') {
      return new Response(JSON.stringify({ error: 'Invalid category' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Fetch feeds
    let feedsToFetch = category === 'top' 
      ? Object.values(RSS_FEEDS).flat().slice(0, 10)
      : RSS_FEEDS[category];
    
    const feedPromises = feedsToFetch.map(async (feedInfo) => {
      try {
        const feed = await parseRSSFeed(feedInfo.url);
        
        return feed.items.slice(0, 5).map((item, index) => ({
          id: `${category}-${feedInfo.source}-${index}-${Date.now()}`,
          category: category,
          image: item.mediaContent || getDefaultImage(category),
          title: item.title || 'Untitled',
          description: cleanDescription(item.description || ''),
          source: feedInfo.source,
          url: item.link,
          pubDate: item.pubDate || new Date().toISOString(),
          size: 'standard'
        }));
      } catch (error) {
        console.error(`Error fetching feed from ${feedInfo.source}:`, error);
        return [];
      }
    });
    
    const allFeedResults = await Promise.all(feedPromises);
    let allArticles = allFeedResults.flat();
    
    // Sort and limit
    allArticles.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
    allArticles = allArticles.slice(0, limit);
    
    // Assign sizes
    allArticles = allArticles.map((article, index) => ({
      ...article,
      size: index === 0 ? 'featured' : ['standard', 'wide', 'compact'][index % 3]
    }));
    
    const responseData = {
      category,
      articles: allArticles,
      count: allArticles.length,
      timestamp: new Date().toISOString()
    };
    
    // Cache the response
    cache.set(cacheKey, {
      data: responseData,
      timestamp: Date.now()
    });
    
    return new Response(JSON.stringify(responseData), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error in getFeed:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch RSS articles',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

function cleanDescription(html) {
  // Simple HTML stripping
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&[^;]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 300);
}

function getDefaultImage(category) {
  const categoryImages = {
    tech: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&auto=format&fit=crop&q=60',
    sports: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=500&auto=format&fit=crop&q=60',
    finance: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=500&auto=format&fit=crop&q=60',
    art: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500&auto=format&fit=crop&q=60',
    tv: 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=500&auto=format&fit=crop&q=60',
    politics: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=500&auto=format&fit=crop&q=60'
  };
  
  return categoryImages[category] || categoryImages.tech;
}
```

## Testing Your Adaptations

1. **Local Testing**:
   ```bash
   cd backend-worker
   wrangler dev
   ```

2. **Test Each Endpoint**:
   ```bash
   # Test chat
   curl -X POST http://localhost:8787/api/chat \
     -H "Content-Type: application/json" \
     -d '{"modelType": "gemini-2-flash", "prompt": "Hello"}'
   
   # Test image generation
   curl -X POST http://localhost:8787/api/v1/images/generate \
     -H "Content-Type: application/json" \
     -d '{"prompt": "A beautiful sunset"}'
   
   # Test RSS
   curl http://localhost:8787/api/rss/feed?category=tech&limit=5
   ```

3. **Check Logs**:
   ```bash
   wrangler tail
   ```

## Common Pitfalls

1. **Forgetting to use `env` instead of `process.env`**
2. **Not awaiting `request.json()`**
3. **Using Node.js-specific modules (fs, path, crypto)**
4. **Not setting proper Content-Type headers**
5. **Forgetting to handle streaming differently**

## Next Steps

After adapting all controllers:

1. Test each endpoint thoroughly
2. Check error handling
3. Verify CORS headers
4. Test with the frontend locally
5. Deploy and test in production 