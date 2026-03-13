// RSS feed sources for different categories
const RSS_FEEDS = {
  top: [
    'https://feeds.bbci.co.uk/news/rss.xml',
    'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml',
    'https://rss.cnn.com/rss/cnn_topstories.rss',
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
    'https://feeds.bbci.co.uk/sport/rss.xml',
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
const MIN_ARTICLE_CONTENT_LENGTH = 280;
const ARTICLE_CONTAINER_SELECTORS = [
  '[itemprop="articleBody"]',
  'article',
  '[data-testid*="article-body"]',
  '[data-testid*="ArticleBody"]',
  '[class*="article-body"]',
  '[class*="articleBody"]',
  '[class*="article-content"]',
  '[class*="ArticleContent"]',
  '[class*="story-body"]',
  '[class*="storyBody"]',
  '[class*="story-content"]',
  '[class*="entry-content"]',
  '[class*="post-content"]',
  '[class*="content-body"]',
  'main'
];
const STRIP_CONTENT_SELECTORS = [
  'script',
  'style',
  'noscript',
  'svg',
  'iframe',
  'nav',
  'footer',
  'header',
  'aside',
  'form',
  'button',
  '[role="navigation"]',
  '[aria-label*="share" i]',
  '[aria-label*="advert" i]',
  '[class*="share"]',
  '[class*="social"]',
  '[class*="newsletter"]',
  '[class*="subscribe"]',
  '[class*="promo"]',
  '[class*="related"]',
  '[class*="ad-"]',
  '[class*="advert"]',
  '[id*="ad-"]',
  '[id*="advert"]'
];
const ARTICLE_NOISE_PATTERNS = [
  /\badvertisement\b/i,
  /\bsubscribe\b/i,
  /\bsign up\b/i,
  /\bnewsletter\b/i,
  /\bcookie policy\b/i,
  /\bprivacy policy\b/i,
  /\bterms of use\b/i,
  /\ball rights reserved\b/i,
  /\bread more\b/i,
  /\bclick here\b/i
];

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

const normalizeText = (text) => cleanText((text || '').replace(/\u00a0/g, ' '));

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

const parseHtml = (html) => {
  if (!html || typeof DOMParser === 'undefined') {
    return null;
  }

  try {
    return new DOMParser().parseFromString(html, 'text/html');
  } catch {
    return null;
  }
};

const getMetaContent = (doc, selectors) => {
  for (const selector of selectors) {
    const value = doc.querySelector(selector)?.getAttribute('content');
    if (value) {
      return value.trim();
    }
  }

  return null;
};

const flattenJsonLdNodes = (value, bucket = []) => {
  if (!value) {
    return bucket;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => flattenJsonLdNodes(item, bucket));
    return bucket;
  }

  if (typeof value !== 'object') {
    return bucket;
  }

  bucket.push(value);

  if (Array.isArray(value['@graph'])) {
    value['@graph'].forEach((item) => flattenJsonLdNodes(item, bucket));
  }

  return bucket;
};

const parseJsonLdArticle = (doc) => {
  const scripts = Array.from(doc.querySelectorAll('script[type="application/ld+json"]'));
  let bestArticle = null;

  scripts.forEach((script) => {
    if (!script.textContent) {
      return;
    }

    try {
      const nodes = flattenJsonLdNodes(JSON.parse(script.textContent));

      nodes.forEach((node) => {
        const rawType = node?.['@type'];
        const types = Array.isArray(rawType) ? rawType : [rawType];
        const isArticle = types.some((type) => typeof type === 'string' && /article/i.test(type));

        if (!isArticle) {
          return;
        }

        const content = normalizeText(node.articleBody || '');

        if (!content || content.length < MIN_ARTICLE_CONTENT_LENGTH) {
          return;
        }

        const imageValue = Array.isArray(node.image)
          ? node.image[0]
          : node.image?.url || node.image || null;

        if (!bestArticle || content.length > bestArticle.content.length) {
          bestArticle = {
            content,
            title: normalizeText(node.headline || node.name || ''),
            image: typeof imageValue === 'string' ? imageValue : null,
            score: content.length + 400
          };
        }
      });
    } catch {
      // Ignore malformed structured data.
    }
  });

  return bestArticle;
};

const stripNonContentNodes = (element) => {
  const clone = element.cloneNode(true);
  clone.querySelectorAll(STRIP_CONTENT_SELECTORS.join(',')).forEach((node) => node.remove());
  return clone;
};

const isNoiseParagraph = (text, node) => {
  if (!text || text.length < 40) {
    return true;
  }

  if (ARTICLE_NOISE_PATTERNS.some((pattern) => pattern.test(text))) {
    return true;
  }

  const linkedTextLength = Array.from(node.querySelectorAll('a')).reduce((total, link) => {
    return total + normalizeText(link.textContent || '').length;
  }, 0);

  if (linkedTextLength > 0 && linkedTextLength / text.length > 0.6) {
    return true;
  }

  return false;
};

const collectCandidateParagraphs = (root) => {
  const textNodes = Array.from(root.querySelectorAll('p, h2, h3'));
  const seen = new Set();
  const paragraphs = [];

  if (!textNodes.length) {
    const text = normalizeText(root.textContent || '');
    return text.length >= MIN_ARTICLE_CONTENT_LENGTH ? [text] : [];
  }

  textNodes.forEach((node) => {
    const text = normalizeText(node.textContent || node.innerText || '');

    if (seen.has(text) || isNoiseParagraph(text, node)) {
      return;
    }

    seen.add(text);
    paragraphs.push(text);
  });

  return paragraphs;
};

const scoreCandidateElement = (element) => {
  const contentRoot = stripNonContentNodes(element);
  const paragraphs = collectCandidateParagraphs(contentRoot);

  if (!paragraphs.length) {
    return null;
  }

  const content = paragraphs.join('\n\n');
  if (content.length < MIN_ARTICLE_CONTENT_LENGTH) {
    return null;
  }

  const descriptor = `${contentRoot.tagName || ''} ${contentRoot.className || ''} ${contentRoot.id || ''}`.toLowerCase();
  let score = content.length + (paragraphs.length * 35);

  if (contentRoot.matches?.('article, [itemprop="articleBody"]')) {
    score += 250;
  }

  if (/(article|story|content|body|entry|post)/.test(descriptor)) {
    score += 120;
  }

  if (/(comment|footer|header|nav|share|social|related|promo|subscribe)/.test(descriptor)) {
    score -= 250;
  }

  return { content, score };
};

const extractArticleContentFromHtml = (html) => {
  const doc = parseHtml(html);

  if (!doc?.body) {
    return null;
  }

  const structuredArticle = parseJsonLdArticle(doc);
  const title = structuredArticle?.title
    || normalizeText(
      getMetaContent(doc, [
        'meta[property="og:title"]',
        'meta[name="twitter:title"]'
      ]) || doc.title || ''
    )
    || null;
  const image = structuredArticle?.image
    || getMetaContent(doc, [
      'meta[property="og:image"]',
      'meta[name="twitter:image"]'
    ])
    || null;

  let bestCandidate = structuredArticle || null;
  const visited = new Set();

  ARTICLE_CONTAINER_SELECTORS.forEach((selector) => {
    doc.querySelectorAll(selector).forEach((element) => {
      if (visited.has(element)) {
        return;
      }

      visited.add(element);
      const candidate = scoreCandidateElement(element);

      if (candidate && (!bestCandidate || candidate.score > bestCandidate.score)) {
        bestCandidate = candidate;
      }
    });
  });

  const bodyCandidate = scoreCandidateElement(doc.body);
  if (bodyCandidate && (!bestCandidate || bodyCandidate.score > bestCandidate.score)) {
    bestCandidate = bodyCandidate;
  }

  if (!bestCandidate?.content) {
    return null;
  }

  return {
    content: bestCandidate.content,
    title,
    image
  };
};

const buildFallbackArticleContent = (rawContent, fallbackDescription = '') => {
  const htmlFragment = rawContent ? `<article>${rawContent}</article>` : '';
  const extractedRaw = htmlFragment ? extractArticleContentFromHtml(htmlFragment) : null;
  const rawText = extractedRaw?.content || normalizeText(rawContent || '');
  const descriptionText = normalizeText(fallbackDescription || '');
  const content = rawText.length > descriptionText.length ? rawText : descriptionText;

  return {
    content,
    title: extractedRaw?.title || null,
    image: extractedRaw?.image || null
  };
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
 * @param {Object|string} options - Scrape options or fallback description string
 * @returns {Promise<Object>} Article content and metadata
 */
export const fetchArticleContent = async (url, options = {}) => {
  const resolvedOptions = typeof options === 'string'
    ? { fallbackDescription: options }
    : (options || {});
  const {
    fallbackDescription = '',
    rawContent = ''
  } = resolvedOptions;
  const fallbackContent = buildFallbackArticleContent(rawContent, fallbackDescription);

  // console.log(`Fetching article content from: ${url}`);
  
  // 1. Try to use a proxy to get the HTML content
  try {
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeoutId = controller ? setTimeout(() => controller.abort(), 8000) : null;
    const response = await fetch(proxyUrl, {
      signal: controller?.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NewsReader/1.0)' }
    }).finally(() => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    });
    
    if (response.ok) {
      const html = await response.text();

      const extracted = extractArticleContentFromHtml(html);
      const extractedLength = extracted?.content?.length || 0;
      const fallbackLength = fallbackContent.content?.length || 0;
      const shouldUseExtracted = extractedLength >= MIN_ARTICLE_CONTENT_LENGTH
        && (fallbackLength === 0 || extractedLength >= Math.max(MIN_ARTICLE_CONTENT_LENGTH, fallbackLength * 0.75));

      if (shouldUseExtracted) {
        return {
          content: extracted.content,
          extracted: true,
          title: extracted.title || fallbackContent.title,
          image: extracted.image || fallbackContent.image
        };
      }
    }
  } catch (e) {
    console.warn('Scraping failed:', e);
  }
  
  if (fallbackContent.content) {
    return {
      content: fallbackContent.content,
      extracted: false,
      title: fallbackContent.title,
      image: fallbackContent.image
    };
  }

  return {
    content: 'Full content unavailable. Please visit the source link to read more.',
    extracted: false,
    title: null,
    image: null
  };
}; 
