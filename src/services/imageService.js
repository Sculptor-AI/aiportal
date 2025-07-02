import axios from 'axios';

// Build backend base URL robustly (exactly one /api suffix, no duplicate slashes)
<<<<<<< Updated upstream
const rawBaseUrl = 'https://73.118.140.130:3000'; // Hardcoded to use the specified backend
=======
const rawBaseUrl = import.meta.env.VITE_BACKEND_API_URL || 'https://73.118.140.130:3000';
>>>>>>> Stashed changes

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

const API_URL = buildApiUrl('/v1/images'); // Backend image generation endpoint

/**
 * Calls the backend API to generate an image based on the provided prompt.
 * @param {string} prompt - The text prompt for image generation.
 * @returns {Promise<object>} The API response data (e.g., { imageData: 'base64...' } or { imageUrl: '...' })
 * @throws {Error} If the API call fails or returns an error.
 */
export const generateImageApi = async (prompt) => {
  try {
    // Retrieve the auth token from localStorage (or your auth context/state management)
    // This assumes you store your JWT or session token under 'userInfo' and then 'token' property.
    // Adjust this according to how you manage authentication tokens in your frontend.
    const userInfo = localStorage.getItem('userInfo') 
      ? JSON.parse(localStorage.getItem('userInfo')) 
      : null;
    const token = userInfo?.token;

    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    } else {
      // Handle cases where the token is not available, if necessary.
      // For a protected route, this might mean the request will be rejected by the backend.
      console.warn('No auth token found for generateImageApi call. Request might fail if endpoint is protected.');
    }

    const response = await axios.post(`${API_URL}/generate`, { prompt }, config);
    return response.data; // Expects { imageData: "..." } or { imageUrl: "..." }
  } catch (error) {
    console.error('Error calling generate image API:', error.response ? error.response.data : error.message);
    // Re-throw the error so the component can catch it and display a message
    // Or, you could process it here and return a standardized error object
    if (error.response && error.response.data) {
      throw error.response.data; // Throw the backend's error response for more specific messages
    }
    throw new Error(error.message || 'Network error or server unresponsive');
  }
}; 