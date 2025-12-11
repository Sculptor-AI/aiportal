// RSS feed sources for different categories
const RSS_FEEDS = {
  top: [
    'http://feeds.bbci.co.uk/news/rss.xml',
    'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml',
    'http://rss.cnn.com/rss/cnn_topstories.rss',
    'https://feeds.npr.org/1001/rss.xml'
  ],
  tech: [
    'https://www.theverge.com/rss/index.xml',
    'https://techcrunch.com/feed/',
    'https://www.wired.com/feed/rss',
    'https://arstechnica.com/feed/'
  ],
  sports: [
    'https://www.espn.com/espn/rss/news',
    'http://feeds.bbci.co.uk/sport/rss.xml',
    'https://sports.yahoo.com/rss/'
  ],
  finance: [
    'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10000664',
    'https://finance.yahoo.com/news/rssindex',
    'https://feeds.bloomberg.com/markets/news.xml'
  ],
  art: [
    'https://hyperallergic.com/feed/',
    'https://www.thisiscolossal.com/feed/',
    'https://news.artnet.com/feed'
  ],
  tv: [
    'https://tvline.com/feed/',
    'https://variety.com/feed/',
    'https://www.hollywoodreporter.com/c/arts/tv/feed/'
  ],
  politics: [
    'https://www.politico.com/rss/politicopicks.xml',
    'https://www.huffpost.com/section/politics/feed',
    'https://thehill.com/feed/'
  ]
};

// Card size variants for layout - Weighted towards standard sizes to prevent gaps
const CARD_SIZES = ['standard', 'standard', 'standard', 'wide', 'tall'];

/**
 * Clean text content by removing HTML tags, entities, and extra whitespace
 */
const cleanText = (text) => {
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
    '&apos;': "'",
    '&nbsp;': ' ',
    '&copy;': '',
    '&reg;': '',
    '&trade;': ''
  };
  
  text = text.replace(/&[a-z0-9#]+;/gi, match => entityMap[match] || match);
  
  return text.trim().replace(/\s+/g, ' ');
};

/**
 * Extract domain from URL
 */
const extractDomain = (url) => {
  try {
    const domain = new URL(url).hostname;
    return domain.replace('www.', '').replace('feeds.', '').replace('rss.', '');
  } catch {
    return 'News Source';
  }
};

/**
 * Try to find a high-quality image from the RSS item
 */
const extractImageFromItem = (item) => {
  // 1. Check enclosure (standard RSS)
  if (item.enclosure && item.enclosure.link) {
    return item.enclosure.link;
  }
  
  // 2. Check thumbnail (common extension)
  if (item.thumbnail) {
    return item.thumbnail;
  }
  
  // 3. Check for media:content or media:group (Yahoo/others)
  // Note: rss2json often maps these to 'enclosure' or 'thumbnail' but sometimes leaves them in 'content'
  
  // 4. Try to extract first image from content/description HTML
  const content = item.content || item.description || '';
  const imgMatch = content.match(/<img[^>]+src="([^">]+)"/);
  if (imgMatch) {
    return imgMatch[1];
  }
  
  return null;
};

/**
 * Parse RSS feed using RSS-to-JSON API
 */
const parseRSSFeed = async (feedUrl) => {
  try {
    // console.log(`Fetching RSS feed: ${feedUrl}`);
    
    // Use RSS2JSON API which handles CORS and converts RSS to JSON
    // We request extended fields to get content
    const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}&api_key=`; // Add API key if available, otherwise free tier
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.status !== 'ok') {
      // console.warn(`RSS2JSON skipped ${feedUrl}: ${data.message}`);
      return [];
    }
    
    if (!data.items || data.items.length === 0) {
      return [];
    }
    
    // Convert to our format
    const articles = data.items.map((item, index) => {
      // Prioritize full content if available in the feed (often content:encoded mapped to content)
      const fullContent = item.content || '';
      const summary = cleanText(item.description);
      
      // Determine size - make the first item featured if it has an image
      let size = 'standard';
      if (index === 0 && extractImageFromItem(item)) {
        size = 'featured';
      } else {
        // Randomly assign other sizes but mostly standard
        size = CARD_SIZES[Math.floor(Math.random() * CARD_SIZES.length)];
      }

      return {
        id: item.guid || item.link || `${feedUrl}-${index}`,
        title: cleanText(item.title) || 'Untitled',
        description: summary.substring(0, 300) + (summary.length > 300 ? '...' : ''),
        url: item.link,
        pubDate: item.pubDate || new Date().toISOString(),
        source: extractDomain(feedUrl),
        category: '', // filled by caller
        image: extractImageFromItem(item),
        size: size,
        rawContent: fullContent // Store raw content for the detailed view
      };
    });
    
    return articles;
  } catch (error) {
    console.error('Error parsing RSS feed:', feedUrl, error);
    return [];
  }
};


/**
 * Fetch articles by category
 * @param {string} category - The category to fetch articles for
 * @param {number} limit - Maximum number of articles to fetch
 * @returns {Promise<Array>} Array of articles
 */
export const fetchArticlesByCategory = async (category, limit = 20) => {
  try {
    const feedKey = category.toLowerCase();
    const feeds = RSS_FEEDS[feedKey] || RSS_FEEDS.top;
    const allArticles = [];
    
    // console.log(`Fetching articles for category: ${category}`);
    
    // Fetch from all feeds in parallel
    const promises = feeds.map(feed => 
      Promise.race([
        parseRSSFeed(feed),
        new Promise((resolve) => setTimeout(() => resolve([]), 5000)) // 5s timeout per feed
      ])
    );
    
    const results = await Promise.all(promises);
    
    results.forEach(feedArticles => {
      if (Array.isArray(feedArticles)) {
        allArticles.push(...feedArticles);
      }
    });
    
    // Sort by publication date (newest first)
    allArticles.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
    
    // Assign category and filter bad data
    const validArticles = allArticles.filter(a => a.title && a.url).map(article => {
      article.category = feedKey;
      return article;
    });
    
    // Dedup by URL
    const uniqueArticles = Array.from(new Map(validArticles.map(item => [item.url, item])).values());

    return uniqueArticles.slice(0, limit);
  } catch (error) {
    console.error(`Error fetching articles for category ${category}:`, error);
    return [];
  }
};

/**
 * Fetch article content
 * @param {string} url - The article URL to scrape
 * @param {string} fallbackDescription - RSS description to use as fallback
 * @returns {Promise<Object>} Article content and metadata
 */
export const fetchArticleContent = async (url, fallbackDescription = '') => {
  // console.log(`Fetching article content from: ${url}`);
  
  // 1. Try to use a proxy to get the HTML content
  try {
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    
    const response = await fetch(proxyUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NewsReader/1.0)' }
    });
    
    if (response.ok) {
      const html = await response.text();
      
      // Basic extraction logic
      // Remove scripts, styles, navs, footers to reduce noise
      let cleanHtml = html
        .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "")
        .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gim, "")
        .replace(/<nav\b[^>]*>([\s\S]*?)<\/nav>/gim, "")
        .replace(/<footer\b[^>]*>([\s\S]*?)<\/footer>/gim, "");

      // Match all paragraphs
      const pRegex = /<p\b[^>]*>([\s\S]*?)<\/p>/gim;
      const paragraphs = [];
      let match;
      while ((match = pRegex.exec(cleanHtml)) !== null) {
        const text = cleanText(match[1]);
        // Filter out short snippets like "Advertisement" or "Read more"
        if (text.length > 60 && !text.includes('Copyright') && !text.includes('Subscribe')) {
          paragraphs.push(text);
        }
      }
      
      if (paragraphs.length > 2) {
         return {
          content: paragraphs.slice(0, 15).join('\n\n'), // Limit to first 15 paragraphs
          extracted: true,
          title: null, // We rely on the RSS title usually
          image: null
        };
      }
    }
  } catch (e) {
    console.warn('Scraping failed:', e);
  }
  
  // Fallback to description
  return {
    content: fallbackDescription || 'Full content unavailable. Please visit the source link to read more.',
    extracted: false,
    title: null,
    image: null
  };
}; 