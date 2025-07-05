// Worker script to serve React SPA and handle API routes
// It handles client-side routing and RSS API endpoints

// RSS feed sources for different categories
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

// Card size variants for layout
const CARD_SIZES = ['featured', 'wide', 'tall', 'compact', 'standard'];

async function parseRSSFeed(feedUrl) {
  try {
    const response = await fetch(feedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const xmlText = await response.text();
    
    // Simple XML parsing for RSS feeds
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

function extractXMLContent(xml, tag) {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1].trim() : null;
}

function cleanText(text) {
  if (!text) return text;
  
  // Remove CDATA wrapper
  text = text.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
  
  // Remove HTML tags
  text = text.replace(/<[^>]*>/g, '');
  
  // Decode HTML entities
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

async function fetchArticlesByCategory(category, limit = 20) {
  const feeds = RSS_FEEDS[category.toLowerCase()] || RSS_FEEDS.top;
  const allArticles = [];
  
  // Fetch from all feeds in parallel
  const promises = feeds.map(feed => parseRSSFeed(feed));
  const results = await Promise.all(promises);
  
  // Combine and shuffle articles
  for (const articles of results) {
    allArticles.push(...articles);
  }
  
  // Sort by publication date and limit
  allArticles.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
  
  // Add category to articles
  allArticles.forEach(article => {
    article.category = category.toLowerCase();
  });
  
  return allArticles.slice(0, limit);
}

async function fetchArticleContent(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const html = await response.text();
    
    // Simple content extraction
    let content = html;
    
    // Remove script and style tags
    content = content.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    content = content.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    
    // Extract text from paragraphs
    const paragraphRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
    const paragraphs = [];
    let match;
    
    while ((match = paragraphRegex.exec(content)) !== null) {
      const text = cleanText(match[1]);
      if (text && text.length > 50) {
        paragraphs.push(text);
      }
    }
    
    return {
      content: paragraphs.join('\n\n'),
      extracted: true,
      title: null,
      image: null
    };
  } catch (error) {
    console.error('Error fetching article content:', error);
    throw new Error('Failed to fetch article content');
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // Handle API routes
    if (url.pathname.startsWith('/api/')) {
      // Enable CORS for API requests
      const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      };
      
      if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
      }
      
      try {
        // RSS Articles by category
        if (url.pathname.startsWith('/api/rss/articles/')) {
          const category = url.pathname.split('/')[4];
          const limit = parseInt(url.searchParams.get('limit') || '20');
          
          const articles = await fetchArticlesByCategory(category, limit);
          
          return new Response(JSON.stringify({ articles }), {
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          });
        }
        
        // All RSS articles
        if (url.pathname === '/api/rss/articles') {
          const limit = parseInt(url.searchParams.get('limit') || '50');
          const allArticles = [];
          
          // Fetch from all categories
          for (const category of Object.keys(RSS_FEEDS)) {
            const articles = await fetchArticlesByCategory(category, 10);
            allArticles.push(...articles);
          }
          
          // Sort and limit
          allArticles.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
          
          return new Response(JSON.stringify({ articles: allArticles.slice(0, limit) }), {
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          });
        }
        
        // Article content scraping
        if (url.pathname === '/api/rss/article-content') {
          const articleUrl = url.searchParams.get('url');
          
          if (!articleUrl) {
            return new Response(JSON.stringify({ error: 'URL parameter required' }), {
              status: 400,
              headers: {
                'Content-Type': 'application/json',
                ...corsHeaders
              }
            });
          }
          
          const content = await fetchArticleContent(articleUrl);
          
          return new Response(JSON.stringify(content), {
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          });
        }
        
        // API route not found
        return new Response(JSON.stringify({ error: 'API endpoint not found' }), {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
        
      } catch (error) {
        console.error('API Error:', error);
        return new Response(JSON.stringify({ error: 'Internal server error' }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }
    }
    
    // Check if this is a request for a static asset
    if (url.pathname.startsWith('/assets/') || 
        url.pathname.startsWith('/images/') ||
        url.pathname.includes('.')) {
      // Let Cloudflare serve the static asset from your dist directory
      return env.ASSETS.fetch(request);
    }

    // For all other requests, serve index.html to handle client-side routing
    return env.ASSETS.fetch(`${url.origin}/index.html`);
  }
};