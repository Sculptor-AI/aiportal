import axios from 'axios';

// Prefer environment variable, otherwise default to same-origin
const rawBaseUrl = import.meta.env.VITE_BACKEND_API_URL || '';

// Remove trailing slashes
let cleanedBase = rawBaseUrl.replace(/\/+$/, '');

// Remove a trailing /api if present
if (cleanedBase.endsWith('/api')) {
  cleanedBase = cleanedBase.slice(0, -4);
}

const BACKEND_API_BASE = `${cleanedBase}/api`;

console.log('[imageService] Computed BACKEND_API_BASE:', BACKEND_API_BASE);

// Remove duplicated /api in endpoint paths
const buildApiUrl = (endpoint) => {
  if (!endpoint) return BACKEND_API_BASE;

  // Normalize endpoint to remove a leading slash if it exists
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;

  // Prevent double "api" segment
  if (normalizedEndpoint.startsWith('api/')) {
    return `${BACKEND_API_BASE}/${normalizedEndpoint.substring(4)}`;
  }

  return `${BACKEND_API_BASE}/${normalizedEndpoint}`;
};

const API_URL = buildApiUrl('/image'); // Backend image generation endpoint
const VIDEO_API_URL = buildApiUrl('/video'); // Backend video generation endpoint

/**
 * Calls the backend API to generate an image based on the provided prompt.
 * @param {string} prompt - The text prompt for image generation.
 * @param {string} [model] - Optional model ID (e.g., 'nano-banana', 'gpt-image').
 * @param {Array} [history] - Optional conversation history for multi-turn generation.
 * @returns {Promise<object>} The API response data (e.g., { imageData: 'base64...' } or { imageUrl: '...' })
 * @throws {Error} If the API call fails or returns an error.
 */
export const generateImageApi = async (prompt, model, history = []) => {
  try {
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const body = { prompt };
    if (model) body.model = model;
    
    // Include conversation history for multi-turn image generation/editing
    if (history && history.length > 0) {
      body.history = history;
      console.log('[imageService] Sending with history:', history.length, 'items');
    }

    const response = await axios.post(`${API_URL}/generate`, body, config);
    return response.data; // Expects { imageData: "..." } or { imageUrl: "..." }
  } catch (error) {
    console.error('Error calling generate image API:', error.response ? error.response.data : error.message);
    if (error.response && error.response.data) {
      throw error.response.data;
    }
    throw new Error(error.message || 'Network error or server unresponsive');
  }
};

/**
 * Calls the backend API to generate a video based on the provided prompt.
 * @param {string} prompt - The text prompt for video generation.
 * @returns {Promise<object>} The API response data (e.g., { videoData: 'base64...' } or { videoUrl: '...' })
 * @throws {Error} If the API call fails or returns an error.
 */
export const generateVideoApi = async (prompt) => {
  try {
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const response = await axios.post(`${VIDEO_API_URL}/generate`, { prompt }, config);
    return response.data; // Expects { videoData: "..." } or { videoUrl: "..." }
  } catch (error) {
    console.error('Error calling generate video API:', error.response ? error.response.data : error.message);
    if (error.response && error.response.data) {
      throw error.response.data;
    }
    throw new Error(error.message || 'Network error or server unresponsive');
  }
}; 