const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://73.118.140.130:3000';

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
    return data.articles || [];
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
    return data.articles || [];
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