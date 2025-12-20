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
const VIDEO_API_URL = `${BACKEND_API_BASE}/video`;

/**
 * Generate a video using Veo 2
 * @param {string} prompt - Text prompt
 * @param {object} options - Configuration options
 * @param {string} options.aspectRatio - '16:9', '9:16', '1:1', '4:3'
 * @param {string} options.negativePrompt - Optional negative prompt
 */
export const generateVideo = async (prompt, options = {}) => {
  try {
    const response = await axios.post(`${VIDEO_API_URL}/generate`, {
      prompt,
      aspectRatio: options.aspectRatio || '16:9',
      negativePrompt: options.negativePrompt
    });
    
    return response.data; // { success: true, operationName: '...' }
  } catch (error) {
    console.error('Error generating video:', error);
    throw error.response?.data?.error || error.message || 'Failed to start video generation';
  }
};

/**
 * Poll for video generation status
 * @param {string} operationName - The operation ID returned from generateVideo
 */
export const pollVideoStatus = async (operationName) => {
  try {
    // Pass name via query param to handle special chars/slashes safely
    const response = await axios.get(`${VIDEO_API_URL}/status`, {
      params: { name: operationName }
    });
    
    return response.data; // { done: boolean, videoUri: string, ... }
  } catch (error) {
    console.error('Error polling video status:', error);
    throw error.response?.data?.error || error.message || 'Failed to check status';
  }
};

/**
 * Get the download URL for a video (proxied or direct)
 * @param {string} videoUri - The remote video URI
 */
export const getVideoDownloadUrl = (videoUri) => {
  if (!videoUri) return '';
  // Use proxy endpoint to avoid CORS issues with Google storage
  return `${VIDEO_API_URL}/download?url=${encodeURIComponent(videoUri)}`;
};

