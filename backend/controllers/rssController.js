import RSSParser from 'rss-parser';
import axios from 'axios';
import cheerio from 'cheerio';

const parser = new RSSParser({
  customFields: {
    item: [
      ['media:content', 'media:content', {keepArray: true}],
      ['content:encoded', 'contentEncoded'],
      ['dc:creator', 'creator'],
      ['media:thumbnail', 'mediaThumbnail'],
      ['media:group', 'media:group'],
      ['description', 'description'],
      ['encoded', 'encoded']
    ]
  },
  timeout: 10000
});

// Simple in-memory cache
const cache = new Map();
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes (shorter for better image updates)

// Track recently used images to ensure variety
const recentlyUsedImages = new Map(); // category -> array of recently used images
const MAX_RECENT_IMAGES = 20;

/**
 * Get cached data or null if expired
 */
const getCachedData = (key) => {
  const cached = cache.get(key);
  if (!cached) return null;
  
  if (Date.now() - cached.timestamp > CACHE_DURATION) {
    cache.delete(key);
    return null;
  }
  
  return cached.data;
};

/**
 * Set cached data
 */
const setCachedData = (key, data) => {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
};

// RSS feed sources for each category
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

/**
 * Extract image URL from various RSS item formats
 */
const extractImageUrl = async (item, articleUrl) => {
  // First try various RSS feed formats
  
  // Try media:content (used by many feeds)
  if (item['media:content'] && Array.isArray(item['media:content']) && item['media:content'].length > 0) {
    const firstMedia = item['media:content'][0];
    // Check if it's a string (sometimes feeds put URLs directly)
    if (typeof firstMedia === 'string' && firstMedia.startsWith('http')) {
      return firstMedia;
    }
    // Check for $ property structure
    if (firstMedia && firstMedia.$ && firstMedia.$.url) {
      return firstMedia.$.url;
    }
    // Sometimes it's directly on the object
    if (firstMedia && firstMedia.url) {
      return firstMedia.url;
    }
  }
  
  // Try media:thumbnail
  if (item['media:thumbnail']) {
    if (item['media:thumbnail'].$ && item['media:thumbnail'].$.url) {
      return item['media:thumbnail'].$.url;
    }
    if (item['media:thumbnail'].url) {
      return item['media:thumbnail'].url;
    }
  }
  
  // Try mediaThumbnail (different format)
  if (item.mediaThumbnail) {
    if (item.mediaThumbnail.$ && item.mediaThumbnail.$.url) {
      return item.mediaThumbnail.$.url;
    }
    if (typeof item.mediaThumbnail === 'string') {
      return item.mediaThumbnail;
    }
  }
  
  // Try enclosure (common in podcasts and some news feeds)
  if (item.enclosure && item.enclosure.url && item.enclosure.type && item.enclosure.type.startsWith('image/')) {
    return item.enclosure.url;
  }
  
  // Direct image property
  if (item.image && typeof item.image === 'string') {
    return item.image;
  }
  
  // Try to extract from content:encoded or description
  const contentToCheck = [
    item['content:encoded'],
    item.contentEncoded,
    item.content,
    item.description
  ];
  
  for (const content of contentToCheck) {
    if (content) {
      // Look for og:image meta tag pattern
      const ogImageMatch = content.match(/property="og:image"\s+content="([^"]+)"/);
      if (ogImageMatch) {
        return ogImageMatch[1];
      }
      
      // Look for any img tag
      const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/i);
      if (imgMatch) {
        return imgMatch[1];
      }
    }
  }
  
  // If no image found in RSS, try to scrape from the article URL
  if (articleUrl) {
    try {
      console.log(`No RSS image found, attempting to scrape from: ${articleUrl}`);
      const response = await axios.get(articleUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        timeout: 5000
      });
      
      const $ = cheerio.load(response.data);
      
      // Try Open Graph image first (most reliable)
      const ogImage = $('meta[property="og:image"]').attr('content');
      if (ogImage) {
        // Make sure it's an absolute URL
        if (ogImage.startsWith('http')) {
          return ogImage;
        } else if (ogImage.startsWith('//')) {
          return 'https:' + ogImage;
        } else if (ogImage.startsWith('/')) {
          const urlObj = new URL(articleUrl);
          return `${urlObj.protocol}//${urlObj.host}${ogImage}`;
        }
      }
      
      // Try Twitter card image
      const twitterImage = $('meta[name="twitter:image"]').attr('content');
      if (twitterImage) {
        if (twitterImage.startsWith('http')) {
          return twitterImage;
        }
      }
      
      // Try first image in article
      const firstImg = $('article img, main img, .content img').first().attr('src');
      if (firstImg && firstImg.startsWith('http')) {
        return firstImg;
      }
    } catch (error) {
      console.error(`Failed to scrape image from ${articleUrl}:`, error.message);
    }
  }
  
  // If still no image, search for related images online (if enabled)
  const autoFetchImages = process.env.AUTO_FETCH_IMAGES !== 'false'; // Default to true
  
  if (autoFetchImages) {
    console.log(`No image found from RSS or scraping, searching for related image for: ${item.title}`);
    return await searchRelatedImage(item.title || '', item.category || 'tech');
  }
  
  // Fallback to simple category placeholder if auto-fetch is disabled
  const categoryImages = {
    tech: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&auto=format&fit=crop&q=60',
    sports: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=500&auto=format&fit=crop&q=60',
    finance: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=500&auto=format&fit=crop&q=60',
    art: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500&auto=format&fit=crop&q=60',
    tv: 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=500&auto=format&fit=crop&q=60',
    politics: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=500&auto=format&fit=crop&q=60'
  };
  
  return categoryImages[item.category] || 'https://images.unsplash.com/photo-1585282263861-f55e341878f8?w=500&auto=format&fit=crop&q=60';
};

/**
 * Extract clean text content from HTML
 */
const extractTextContent = (html) => {
  if (!html) return '';
  
  // Use cheerio to properly parse HTML and decode entities
  try {
    const $ = cheerio.load(html);
    // Remove script and style elements
    $('script, style').remove();
    
    // Get text content
    let text = $.text();
    
    // Clean up the text
    text = text
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/\n+/g, ' ') // Replace multiple newlines with space
      .trim();
    
    // Limit to 300 chars for better readability in cards
    if (text.length > 300) {
      text = text.substring(0, 297) + '...';
    }
    
    return text;
  } catch (error) {
    // Fallback to regex if cheerio fails
    return html
      .replace(/<[^>]*>/g, ' ')
      .replace(/&[^;]+;/g, ' ') // Remove HTML entities
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 300);
  }
};

/**
 * Determine article size for grid layout
 */
const determineArticleSize = (index, totalArticles) => {
  // First article is featured
  if (index === 0) return 'featured';
  
  // Mix of different sizes for visual variety
  const sizePattern = ['standard', 'wide', 'compact', 'standard', 'compact', 'tall'];
  return sizePattern[index % sizePattern.length];
};

/**
 * Fetch articles from RSS feeds for a specific category
 */
export const fetchArticlesByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { limit = 10 } = req.query;
    
    console.log(`Fetching RSS articles for category: ${category}`);
    
    // Validate category
    if (!RSS_FEEDS[category]) {
      return res.status(400).json({ error: 'Invalid category' });
    }
    
    // Check cache first
    const cacheKey = `articles-${category}-${limit}`;
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      console.log(`Returning cached articles for category: ${category}`);
      return res.status(200).json(cachedData);
    }
    
    // Handle 'top' category differently - fetch from all categories
    let feedsToFetch;
    if (category === 'top') {
      // Get 1-2 feeds from each category for variety
      feedsToFetch = [];
      Object.entries(RSS_FEEDS).forEach(([cat, feeds]) => {
        if (cat !== 'top' && feeds.length > 0) {
          feedsToFetch.push({ ...feeds[0], category: cat });
          if (feeds.length > 1) {
            feedsToFetch.push({ ...feeds[1], category: cat });
          }
        }
      });
    } else {
      feedsToFetch = RSS_FEEDS[category].map(feed => ({ ...feed, category }));
    }
    
    // Fetch all feeds in parallel
    const feedPromises = feedsToFetch.map(async (feedInfo) => {
      try {
        console.log(`Fetching from ${feedInfo.source}: ${feedInfo.url}`);
        const feed = await parser.parseURL(feedInfo.url);
        
        // Transform feed items to match frontend structure
        const transformedItems = await Promise.all(
          feed.items.slice(0, 5).map(async (item, index) => ({
            id: `${feedInfo.category}-${feedInfo.source}-${index}-${Date.now()}`,
            category: feedInfo.category,
            image: await extractImageUrl(item, item.link),
            title: item.title || 'Untitled',
            description: item.contentSnippet || extractTextContent(item.content) || item.description || '',
            source: feedInfo.source,
            url: item.link,
            pubDate: item.pubDate || item.isoDate || new Date().toISOString(),
            size: 'standard' // Will be determined later based on position
          }))
        );
        return transformedItems;
      } catch (error) {
        console.error(`Error fetching feed from ${feedInfo.source}:`, error.message);
        return []; // Return empty array if feed fails
      }
    });
    
    // Wait for all feeds to complete
    const allFeedResults = await Promise.all(feedPromises);
    
    // Flatten all articles
    let allArticles = allFeedResults.flat();
    
    // Sort by publication date (newest first)
    allArticles.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
    
    // Limit the number of articles
    allArticles = allArticles.slice(0, parseInt(limit));
    
    // Assign sizes for visual variety
    allArticles = allArticles.map((article, index) => ({
      ...article,
      size: determineArticleSize(index, allArticles.length)
    }));
    
    console.log(`Returning ${allArticles.length} articles for category: ${category}`);
    
    const responseData = {
      category,
      articles: allArticles,
      count: allArticles.length,
      timestamp: new Date().toISOString()
    };
    
    // Cache the response
    setCachedData(cacheKey, responseData);
    
    res.status(200).json(responseData);
    
  } catch (error) {
    console.error('Error in fetchArticlesByCategory:', error);
    res.status(500).json({ 
      error: 'Failed to fetch RSS articles',
      details: error.message 
    });
  }
};

/**
 * Fetch articles from all categories
 */
export const fetchAllArticles = async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    
    console.log('Fetching RSS articles from all categories');
    
    // Check cache first
    const cacheKey = `articles-all-${limit}`;
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      console.log('Returning cached articles from all categories');
      return res.status(200).json(cachedData);
    }
    
    // Fetch from all categories
    const categoryPromises = Object.keys(RSS_FEEDS)
      .filter(cat => cat !== 'top') // Exclude 'top' to avoid duplication
      .map(async (category) => {
        const feeds = RSS_FEEDS[category];
        if (feeds.length === 0) return [];
        
        // Fetch from first feed of each category
        try {
          const feed = await parser.parseURL(feeds[0].url);
          const transformedItems = await Promise.all(
            feed.items.slice(0, 3).map(async (item, index) => ({
              id: `${category}-${feeds[0].source}-${index}-${Date.now()}`,
              category,
              image: await extractImageUrl(item, item.link),
              title: item.title || 'Untitled',
              description: item.contentSnippet || extractTextContent(item.content) || item.description || '',
              source: feeds[0].source,
              url: item.link,
              pubDate: item.pubDate || item.isoDate || new Date().toISOString(),
              size: 'standard'
            }))
          );
          return transformedItems;
        } catch (error) {
          console.error(`Error fetching ${category} feed:`, error.message);
          return [];
        }
      });
    
    const allCategoryResults = await Promise.all(categoryPromises);
    let allArticles = allCategoryResults.flat();
    
    // Sort by publication date
    allArticles.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
    
    // Limit and assign sizes
    allArticles = allArticles.slice(0, parseInt(limit));
    allArticles = allArticles.map((article, index) => ({
      ...article,
      size: determineArticleSize(index, allArticles.length)
    }));
    
    console.log(`Returning ${allArticles.length} articles from all categories`);
    
    const responseData = {
      articles: allArticles,
      count: allArticles.length,
      timestamp: new Date().toISOString()
    };
    
    // Cache the response
    setCachedData(cacheKey, responseData);
    
    res.status(200).json(responseData);
    
  } catch (error) {
    console.error('Error in fetchAllArticles:', error);
    res.status(500).json({ 
      error: 'Failed to fetch RSS articles',
      details: error.message 
    });
  }
};

/**
 * Extract article content by scraping the URL
 */
const extractArticleContent = async (url) => {
  try {
    console.log(`Scraping article content from: ${url}`);
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
      timeout: 15000,
      maxRedirects: 5
    });
    
    const html = response.data;
    const $ = cheerio.load(html);
    
    // Extract metadata
    const title = $('meta[property="og:title"]').attr('content') || 
                  $('title').text() || 
                  $('h1').first().text();
    
    const author = $('meta[name="author"]').attr('content') || 
                   $('meta[property="article:author"]').attr('content') ||
                   $('.author-name, .by-author, .author').first().text().trim();
    
    const publishDate = $('meta[property="article:published_time"]').attr('content') ||
                       $('time').first().attr('datetime') ||
                       $('meta[name="publish_date"]').attr('content');
    
    const image = $('meta[property="og:image"]').attr('content');
    
    // Remove unwanted elements
    $('script, style, noscript, iframe, nav, header, footer, aside').remove();
    $('.advertisement, .ads, .ad-container, .social-share, .newsletter-signup').remove();
    $('.related-articles, .comments, .comment-section').remove();
    
    // Try to find main content using various selectors
    let contentHtml = '';
    let contentText = '';
    
    // Site-specific selectors
    const siteSpecificSelectors = {
      'theverge.com': '.c-entry-content',
      'techcrunch.com': '.article-content',
      'wired.com': '.article__body',
      'arstechnica.com': '.article-content',
      'nytimes.com': 'section[name="articleBody"]',
      'espn.com': '.article-body',
      'bloomberg.com': '.body-content',
      'politico.com': '.story-text',
      'variety.com': '.article-content',
      'hollywoodreporter.com': '.article-content'
    };
    
    // Check if URL matches any specific site
    for (const [site, selector] of Object.entries(siteSpecificSelectors)) {
      if (url.includes(site)) {
        const element = $(selector);
        if (element.length > 0) {
          contentHtml = element.html();
          contentText = element.text().trim();
          break;
        }
      }
    }
    
    // If no site-specific content found, try generic selectors
    if (!contentText) {
      const genericSelectors = [
        'article .content',
        'article [itemprop="articleBody"]',
        '.article-body',
        '.entry-content',
        '.post-content',
        'article main',
        'main article',
        '[role="main"] article',
        '.story-body',
        '.content-body'
      ];
      
      for (const selector of genericSelectors) {
        const element = $(selector);
        if (element.length > 0 && element.text().trim().length > 100) {
          contentHtml = element.html();
          contentText = element.text().trim();
          break;
        }
      }
    }
    
    // Last resort: get all paragraphs within article or main
    if (!contentText || contentText.length < 100) {
      const paragraphs = $('article p, main p, .content p').map((i, el) => {
        const text = $(el).text().trim();
        return text.length > 20 ? text : null;
      }).get().filter(Boolean);
      
      if (paragraphs.length > 0) {
        contentText = paragraphs.join('\n\n');
      }
    }
    
    // Format content for better readability
    if (contentHtml) {
      // Convert HTML to formatted text
      const $content = cheerio.load(contentHtml);
      
      // Convert paragraphs
      $content('p').each((i, el) => {
        const text = $content(el).text().trim();
        if (text) {
          $content(el).replaceWith(text + '\n\n');
        }
      });
      
      // Convert headers
      $content('h1, h2, h3, h4, h5, h6').each((i, el) => {
        const text = $content(el).text().trim();
        if (text) {
          $content(el).replaceWith('\n\n' + text.toUpperCase() + '\n\n');
        }
      });
      
      // Convert lists
      $content('li').each((i, el) => {
        const text = $content(el).text().trim();
        if (text) {
          $content(el).replaceWith('• ' + text + '\n');
        }
      });
      
      // Convert quotes
      $content('blockquote').each((i, el) => {
        const text = $content(el).text().trim();
        if (text) {
          $content(el).replaceWith('\n"' + text + '"\n\n');
        }
      });
      
      contentText = $content.text()
        .replace(/\n{3,}/g, '\n\n') // Remove excessive newlines
        .trim();
    }
    
    // Clean up and limit content
    contentText = contentText
      .replace(/\s+/g, ' ') // Normalize spaces
      .replace(/\n\s*\n/g, '\n\n') // Normalize paragraph breaks
      .trim();
    
    // Limit content length but try to end at a sentence
    if (contentText.length > 5000) {
      contentText = contentText.substring(0, 5000);
      const lastPeriod = contentText.lastIndexOf('.');
      if (lastPeriod > 4500) {
        contentText = contentText.substring(0, lastPeriod + 1);
      }
    }
    
    return {
      title,
      author,
      publishDate,
      image,
      content: contentText || 'Unable to extract article content.',
      extracted: !!contentText && contentText.length > 100
    };
  } catch (error) {
    console.error('Error extracting article content:', error.message);
    return {
      content: 'Unable to extract article content.',
      extracted: false,
      error: error.message
    };
  }
};

/**
 * Fetch full article content
 */
export const fetchArticleContent = async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }
    
    const result = await extractArticleContent(url);
    
    res.status(200).json({
      url,
      ...result
    });
    
  } catch (error) {
    console.error('Error in fetchArticleContent:', error);
    res.status(500).json({ 
      error: 'Failed to fetch article content',
      details: error.message 
    });
  }
};

/**
 * Search for related images using Unsplash API
 */
const searchRelatedImage = async (title, category) => {
  try {
    // Extract keywords from title for better search results
    const keywords = title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Remove special characters
      .split(' ')
      .filter(word => word.length > 3) // Keep words longer than 3 chars
      .slice(0, 5) // Take first 5 keywords
      .join(' ');
    
    // Add category to search for more relevant results
    const searchQuery = `${keywords} ${category}`.trim();
    
    console.log(`Searching for related image with query: "${searchQuery}"`);
    
    // Using Unsplash API (you can also use Pexels or Pixabay)
    // Note: In production, you should use your own API key
    const unsplashAccessKey = process.env.UNSPLASH_ACCESS_KEY || 'YOUR_UNSPLASH_ACCESS_KEY';
    
    if (!unsplashAccessKey || unsplashAccessKey === 'YOUR_UNSPLASH_ACCESS_KEY') {
      // Use a curated set of high-quality stock photos as fallback
      const curatedImages = {
        tech: [
          'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=800&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=800&auto=format&fit=crop'
        ],
        sports: [
          'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=800&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1541252260730-0412e8e2108e?w=800&auto=format&fit=crop'
        ],
        finance: [
          'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1579532537598-459ecdaf39cc?w=800&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?w=800&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1565372195458-9de0b320ef04?w=800&auto=format&fit=crop'
        ],
        art: [
          'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1549289524-06cf8837ace5?w=800&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1578321272176-b7bbc0679853?w=800&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1571115764595-644a1f56a55c?w=800&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=800&auto=format&fit=crop'
        ],
        tv: [
          'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=800&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1585951237318-9ea5e175b891?w=800&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1598743400863-0201c7e1445b?w=800&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1486572788966-cfd3df1f5b42?w=800&auto=format&fit=crop'
        ],
        politics: [
          'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1555848962-6e79363ec58f?w=800&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1569163139394-de4798d9c2c3?w=800&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=800&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1520452112805-c6692c840af0?w=800&auto=format&fit=crop'
        ]
      };
      
      // Return a random image from the category, avoiding recently used ones
      const categoryImages = curatedImages[category] || curatedImages.tech;
      const recentImages = recentlyUsedImages.get(category) || [];
      
      // Find images that haven't been used recently
      const availableImages = categoryImages.filter(img => !recentImages.includes(img));
      const imagesToChooseFrom = availableImages.length > 0 ? availableImages : categoryImages;
      
      // Select a random image
      const selectedImage = imagesToChooseFrom[Math.floor(Math.random() * imagesToChooseFrom.length)];
      
      // Track this image as used
      if (!recentlyUsedImages.has(category)) {
        recentlyUsedImages.set(category, []);
      }
      const categoryRecent = recentlyUsedImages.get(category);
      categoryRecent.push(selectedImage);
      
      // Keep only the most recent images
      if (categoryRecent.length > MAX_RECENT_IMAGES) {
        categoryRecent.shift();
      }
      
      return selectedImage;
    }
    
    // If API key is available, search Unsplash
    const response = await axios.get('https://api.unsplash.com/search/photos', {
      params: {
        query: searchQuery,
        per_page: 10,
        orientation: 'landscape'
      },
      headers: {
        'Authorization': `Client-ID ${unsplashAccessKey}`
      },
      timeout: 3000
    });
    
    if (response.data && response.data.results && response.data.results.length > 0) {
      // Return a random image from the top results for variety
      const randomIndex = Math.floor(Math.random() * Math.min(5, response.data.results.length));
      const photo = response.data.results[randomIndex];
      return photo.urls.regular || photo.urls.small;
    }
    
    throw new Error('No images found');
    
  } catch (error) {
    console.error('Error searching for related image:', error.message);
    
    // Fallback to generic category image
    const fallbackImages = {
      tech: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop',
      sports: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&auto=format&fit=crop',
      finance: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&auto=format&fit=crop',
      art: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&auto=format&fit=crop',
      tv: 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=800&auto=format&fit=crop',
      politics: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800&auto=format&fit=crop'
    };
    
    return fallbackImages[category] || 'https://images.unsplash.com/photo-1585282263861-f55e341878f8?w=800&auto=format&fit=crop';
  }
}; 