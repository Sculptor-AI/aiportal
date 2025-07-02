// Prefer environment variable, otherwise default to same-origin
const rawBaseUrl = import.meta.env.VITE_BACKEND_API_URL || '';
// Remove trailing slashes (if any) and set as API base (empty string means same-origin)
const API_BASE_URL = rawBaseUrl.replace(/\/+$/, '');

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
 * Fetch articles by category
 * @param {string} category - The category to fetch articles for
 * @param {number} limit - Maximum number of articles to fetch
 * @returns {Promise<Array>} Array of articles
 */
export const fetchArticlesByCategory = async (category, limit = 20) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/rss/articles/${category}?limit=${limit}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch articles: ${response.statusText}`);
    }

    const data = await response.json();
    const articles = data.articles || [];

    // Add images for articles that don't have one
    return articles.map(article => {
      if (!article.image) {
        const imageUrl = getImageForArticle(article.title);
        if (imageUrl) {
          return { ...article, image: imageUrl };
        }
      }
      return article;
    });
  } catch (error) {
    console.error(`Error fetching articles for category ${category}:`, error);
    throw error;
  }
};

/**
 * Fetch articles from all categories
 * @param {number} limit - Maximum number of articles to fetch
 * @returns {Promise<Array>} Array of articles
 */
export const fetchAllArticles = async (limit = 50) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/rss/articles?limit=${limit}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch articles: ${response.statusText}`);
    }

    const data = await response.json();
    const articles = data.articles || [];

    // Add images for articles that don't have one
    return articles.map(article => {
      if (!article.image) {
        const imageUrl = getImageForArticle(article.title);
        if (imageUrl) {
          return { ...article, image: imageUrl };
        }
      }
      return article;
    });
  } catch (error) {
    console.error('Error fetching all articles:', error);
    throw error;
  }
};

/**
 * Fetch full article content by scraping the URL
 * @param {string} url - The article URL to scrape
 * @returns {Promise<Object>} Article content and metadata
 */
export const fetchArticleContent = async (url) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/rss/article-content?url=${encodeURIComponent(url)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch article content: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching article content:', error);
    throw error;
  }
}; 