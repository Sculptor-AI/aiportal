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

/**
 * Generates a relevant image URL for an article using multiple free services.
 * This does not require an API key.
 * @param {string} query - The search query for the image (e.g., article title)
 * @returns {string|null} The URL of the image or null
 */
const getImageForArticle = (query) => {
  if (!query) return null;
  
  // Sanitize: lowercase, remove punctuation, split into words, keep first 3-4 words
  const words = query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 3);
  
  if (words.length === 0) return null;
  
  const searchTerm = words.join(' ');
  console.log('Generating image for:', searchTerm);
  
  // Use Pollinations.ai - generates images based on text prompts
  const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(searchTerm)}?width=800&height=600&nologo=true`;
  console.log('Generated image URL:', imageUrl);
  
  return imageUrl;
};

/**
 * Extract content from XML tag
 */
const extractXMLContent = (xml, tag) => {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1].trim() : null;
};

/**
 * Clean text content by removing HTML tags and entities
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
    '&apos;': "'"
  };
  
  text = text.replace(/&[a-z0-9#]+;/gi, match => entityMap[match] || match);
  
  return text.trim();
};

/**
 * Extract domain from URL
 */
const extractDomain = (url) => {
  try {
    const domain = new URL(url).hostname;
    return domain.replace('www.', '').replace('feeds.', '');
  } catch {
    return 'Unknown';
  }
};

/**
 * Parse RSS feed using RSS-to-JSON API
 */
const parseRSSFeed = async (feedUrl) => {
  try {
    console.log(`Fetching RSS feed: ${feedUrl}`);
    
    // Use RSS2JSON API which handles CORS and converts RSS to JSON
    const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`;
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.status !== 'ok') {
      throw new Error(`RSS2JSON API error: ${data.message || 'Unknown error'}`);
    }
    
    console.log(`Got ${data.items?.length || 0} items from ${feedUrl}`);
    
    if (!data.items || data.items.length === 0) {
      return [];
    }
    
    // Convert to our format
    const articles = data.items.map((item, index) => ({
      id: item.guid || item.link || `${feedUrl}-${index}`,
      title: cleanText(item.title) || 'No Title',
      description: cleanText(item.description) || '',
      url: item.link || '#',
      pubDate: item.pubDate || new Date().toISOString(),
      source: extractDomain(feedUrl),
      image: getImageForArticle(item.title),
      size: CARD_SIZES[Math.floor(Math.random() * CARD_SIZES.length)]
    }));
    
    console.log(`Parsed ${articles.length} articles from ${feedUrl}`);
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
    const feeds = RSS_FEEDS[category.toLowerCase()] || RSS_FEEDS.top;
    const allArticles = [];
    
    console.log(`Fetching articles for category: ${category}`);
    
    // Fetch from all feeds in parallel with timeout
    const promises = feeds.map(feed => 
      Promise.race([
        parseRSSFeed(feed),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 10000)
        )
      ])
    );
    
    const results = await Promise.allSettled(promises);
    
    // Combine successful results
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value.length > 0) {
        allArticles.push(...result.value);
      }
    }
    
    // If no articles were fetched, log warning but still try to return what we have
    if (allArticles.length === 0) {
      console.warn(`No RSS articles found for ${category}`);
    }
    
    // Sort by publication date and limit
    allArticles.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
    
    // Add category to articles
    allArticles.forEach(article => {
      article.category = category.toLowerCase();
    });
    
    return allArticles.slice(0, limit);
  } catch (error) {
    console.error(`Error fetching articles for category ${category}:`, error);
    return [];
  }
};

/**
 * Fetch articles from all categories
 * @param {number} limit - Maximum number of articles to fetch
 * @returns {Promise<Array>} Array of articles
 */
export const fetchAllArticles = async (limit = 50) => {
  try {
    const allArticles = [];
    
    // Fetch from all categories
    for (const category of Object.keys(RSS_FEEDS)) {
      const articles = await fetchArticlesByCategory(category, 10);
      allArticles.push(...articles);
    }
    
    // Sort and limit
    allArticles.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
    
    return allArticles.slice(0, limit);
  } catch (error) {
    console.error('Error fetching all articles:', error);
    throw error;
  }
};

/**
 * Fetch article content - tries to scrape full content but falls back to description
 * @param {string} url - The article URL to scrape
 * @param {string} fallbackDescription - RSS description to use as fallback
 * @returns {Promise<Object>} Article content and metadata
 */
export const fetchArticleContent = async (url, fallbackDescription = '') => {
  console.log(`Fetching article content from: ${url}`);
  
  // First try to scrape the full article content
  try {
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    
    const response = await fetch(proxyUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)'
      }
    });
    
    if (response.ok) {
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
      
      const extractedContent = paragraphs.join('\n\n');
      
      // If we got good content, return it
      if (extractedContent && extractedContent.length > 200) {
        console.log(`Successfully extracted ${extractedContent.length} chars of content`);
        return {
          content: extractedContent,
          extracted: true,
          title: null,
          image: null
        };
      }
    }
  } catch (error) {
    console.warn('Content scraping failed, using fallback:', error);
  }
  
  // Fallback to using the RSS description
  console.log('Using RSS description as content');
  return {
    content: fallbackDescription || 'No content available for this article.',
    extracted: false,
    title: null,
    image: null
  };
}; 