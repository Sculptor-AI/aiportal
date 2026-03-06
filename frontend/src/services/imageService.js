import axios from 'axios';
import { getAuthHeaders } from './authService';
import { getBackendApiBase } from './backendConfig';
import { createVideoObjectUrl, generateVideo, waitForVideoCompletion } from './videoService';

// Remove duplicated /api in endpoint paths
const buildApiUrl = (endpoint) => {
  const BACKEND_API_BASE = getBackendApiBase();

  if (!endpoint) return BACKEND_API_BASE;

  // Normalize endpoint to remove a leading slash if it exists
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;

  // Prevent double "api" segment
  if (normalizedEndpoint.startsWith('api/')) {
    return `${BACKEND_API_BASE}/${normalizedEndpoint.substring(4)}`;
  }

  return `${BACKEND_API_BASE}/${normalizedEndpoint}`;
};

const getApiUrl = () => buildApiUrl('/image'); // Backend image generation endpoint

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
        ...getAuthHeaders(),
      },
    };

    const body = { prompt };
    if (model) body.model = model;

    // Include conversation history for multi-turn image generation/editing
    if (history && history.length > 0) {
      body.history = history;
      console.log('[imageService] Sending with history:', history.length, 'items');
    }

    const response = await axios.post(`${getApiUrl()}/generate`, body, config);
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
 * Starts a Sora video generation job and resolves once the preview is ready.
 * @param {string} prompt - The text prompt for video generation.
 * @returns {Promise<object>} { videoId, videoUrl }
 */
export const generateVideoApi = async (prompt) => {
  try {
    const job = await generateVideo(prompt);
    if (!job?.success || !job?.videoId) {
      throw new Error(job?.error || 'No video ID returned from API');
    }

    const status = await waitForVideoCompletion(job.videoId);
    if (status?.error || status?.status === 'failed' || status?.status === 'cancelled' || status?.status === 'canceled') {
      throw new Error(status?.error || 'Video generation failed');
    }

    const videoUrl = await createVideoObjectUrl(job.videoId);
    return {
      videoId: job.videoId,
      videoUrl
    };
  } catch (error) {
    console.error('Error calling generate video API:', error.response ? error.response.data : error.message);
    if (error.response && error.response.data) {
      throw error.response.data;
    }
    throw new Error(error.message || 'Network error or server unresponsive');
  }
};
