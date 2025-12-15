/**
 * RSS Feed Service
 */

// RSS Feed Configuration
export const RSS_FEEDS = {
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

/**
 * Extract content from XML tag
 */
function extractXMLContent(xml, tag) {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1].trim() : null;
}

/**
 * Clean text content - removes HTML tags robustly
 */
function cleanText(text) {
  if (!text) return text;
  text = text.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
  
  // Remove HTML tags robustly by repeated replacement to catch nested/overlapping patterns
  let prev;
  do {
    prev = text;
    text = text.replace(/<[^>]*>/g, '');
  } while (text !== prev);
  
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

/**
 * Extract domain from URL
 */
function extractDomain(url) {
  try {
    const domain = new URL(url).hostname;
    return domain.replace('www.', '').replace('feeds.', '');
  } catch {
    return 'Unknown';
  }
}

/**
 * Parse RSS feed and return articles
 */
export async function parseRSSFeed(feedUrl) {
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

/**
 * Fetch articles by category
 */
export async function fetchArticlesByCategory(category, limit = 20) {
  const feeds = RSS_FEEDS[category.toLowerCase()] || RSS_FEEDS.top;
  const promises = feeds.map(feed => parseRSSFeed(feed));
  const results = await Promise.all(promises);
  const allArticles = results.flat();
  allArticles.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
  allArticles.forEach(article => { article.category = category.toLowerCase(); });
  return allArticles.slice(0, limit);
}

/**
 * Fetch article content from URL
 */
export async function fetchArticleContent(url) {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)' }
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  let content = await response.text();
  
  // Remove script tags robustly (loop until no more found)
  let prev;
  do {
    prev = content;
    content = content.replace(/<script[^>]*>[\s\S]*?<\/script\s*>/gi, '');
  } while (content !== prev);
  
  // Remove style tags robustly (loop until no more found)
  do {
    prev = content;
    content = content.replace(/<style[^>]*>[\s\S]*?<\/style\s*>/gi, '');
  } while (content !== prev);
  
  const paragraphRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  const paragraphs = [];
  let match;
  while ((match = paragraphRegex.exec(content)) !== null) {
    const text = cleanText(match[1]);
    if (text && text.length > 50) paragraphs.push(text);
  }
  return { content: paragraphs.join('\n\n'), extracted: true, title: null, image: null };
}

