import { parseRSSFeed } from '../utils/rssParser.js';

// Simple in-memory cache (Workers have ephemeral storage)
const cache = new Map();
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

const RSS_FEEDS = {
  tech: [
    { url: 'https://feeds.feedburner.com/TechCrunch/', source: 'TechCrunch' },
    { url: 'https://www.wired.com/feed/rss', source: 'Wired' },
    { url: 'https://feeds.arstechnica.com/arstechnica/index', source: 'Ars Technica' },
    { url: 'https://www.theverge.com/rss/index.xml', source: 'The Verge' },
    { url: 'https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml', source: 'NY Times Tech' }
  ],
  sports: [
    { url: 'https://www.espn.com/espn/rss/news', source: 'ESPN' },
    { url: 'https://rss.nytimes.com/services/xml/rss/nyt/Sports.xml', source: 'NY Times Sports' },
    { url: 'https://www.cbssports.com/rss/headlines/', source: 'CBS Sports' },
    { url: 'https://api.foxsports.com/v2/content/optimized-rss?partnerKey=zBaFxRyGKCfxBagJG9b8pqLyndmvo7UU', source: 'Fox Sports' }
  ],
  finance: [
    { url: 'https://feeds.bloomberg.com/markets/news.rss', source: 'Bloomberg Markets' },
    { url: 'https://feeds.content.dowjones.io/public/rss/mw_topstories', source: 'MarketWatch' },
    { url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html', source: 'CNBC Finance' },
    { url: 'https://rss.nytimes.com/services/xml/rss/nyt/Business.xml', source: 'NY Times Business' }
  ],
  art: [
    { url: 'https://www.theartnewspaper.com/rss', source: 'The Art Newspaper' },
    { url: 'https://hyperallergic.com/feed/', source: 'Hyperallergic' },
    { url: 'https://www.artnews.com/feed/', source: 'ArtNews' },
    { url: 'https://rss.nytimes.com/services/xml/rss/nyt/Arts.xml', source: 'NY Times Arts' }
  ],
  tv: [
    { url: 'https://www.hollywoodreporter.com/feed/', source: 'Hollywood Reporter' },
    { url: 'https://variety.com/feed/', source: 'Variety' },
    { url: 'https://tvline.com/feed/', source: 'TVLine' },
    { url: 'https://feeds.feedburner.com/thr/television', source: 'THR Television' }
  ],
  politics: [
    { url: 'https://feeds.npr.org/1001/rss.xml', source: 'NPR Politics' },
    { url: 'https://rss.politico.com/politics-news.xml', source: 'Politico' },
    { url: 'https://thehill.com/rss/syndicator/19109', source: 'The Hill' },
    { url: 'https://rss.nytimes.com/services/xml/rss/nyt/Politics.xml', source: 'NY Times Politics' }
  ],
  top: [] // Will be populated with a mix from all categories
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
          category: category === 'top' ? feedInfo.category || 'general' : category,
          image: item.mediaContent || getDefaultImage(category === 'top' ? feedInfo.category : category),
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

// Handle both named export and named function for compatibility
export const fetchArticlesByCategory = getFeed;
export const fetchAllArticles = getFeed;
export const fetchArticleContent = async (request, env) => {
  return new Response(JSON.stringify({ 
    error: 'Article content fetching not implemented in Workers version' 
  }), {
    status: 501,
    headers: { 'Content-Type': 'application/json' }
  });
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