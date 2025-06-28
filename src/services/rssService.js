const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://aiapi.kaileh.dev/api';

const buildUrl = (path) => {
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  return `${BACKEND_URL}/${cleanPath}`;
};

/**
 * Fetches and parses an RSS feed from the backend.
 * @param {string} feedUrl - The URL of the RSS feed to fetch.
 * @returns {Promise<object>} The parsed RSS feed data.
 */
export const fetchRssFeed = async (feedUrl) => {
  try {
    const response = await fetch(buildUrl('rss'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feedUrl }),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching RSS feed:', error);
    throw error;
  }
};

export const fetchArticleContent = async (articleUrl) => {
  try {
    const response = await fetch(buildUrl('rss/content'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleUrl }),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching article content:', error);
    throw error;
  }
};

export const fetchArticlesByCategory = async (category) => {
    // This is a placeholder. You'll need to implement the logic to fetch articles
    // based on a category. This might involve a different backend endpoint
    // or filtering on the client side.
    console.log(`Fetching articles for category: ${category}`);
    return []; 
}; 