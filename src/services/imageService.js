import axios from 'axios';

// Use the backend URL from environment or default to Cloudflare backend
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 
  import.meta.env.VITE_BACKEND_API_URL || 
  'https://aiapi.kaileh.dev';

const buildUrl = (path) => {
  const cleanPath = path.startsWith('/api/') ? path.substring(4) : 
    path.startsWith('/') ? path.substring(1) : path;
  return `${API_BASE_URL}/api/${cleanPath}`;
};

const API_URL = buildUrl('v1/images'); // Backend image generation endpoint

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