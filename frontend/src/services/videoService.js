import axios from 'axios';
import { getAuthHeaders } from './authService';
import { getBackendApiBase } from './backendConfig';

const getVideoApiUrl = () => `${getBackendApiBase()}/video`;

/**
 * Generate a video using Veo 2
 * @param {string} prompt - Text prompt
 * @param {object} options - Configuration options
 * @param {string} options.aspectRatio - '16:9', '9:16', '1:1', '4:3'
 * @param {string} options.negativePrompt - Optional negative prompt
 */
export const generateVideo = async (prompt, options = {}) => {
  try {
    const response = await axios.post(`${getVideoApiUrl()}/generate`, {
      prompt,
      aspectRatio: options.aspectRatio || '16:9',
      negativePrompt: options.negativePrompt
    }, {
      headers: {
        ...getAuthHeaders()
      }
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
    const response = await axios.get(`${getVideoApiUrl()}/status`, {
      params: { name: operationName },
      headers: {
        ...getAuthHeaders()
      }
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
    return `${getVideoApiUrl()}/download?url=${encodeURIComponent(videoUri)}`;
};

/**
 * Download a generated video using authenticated request headers.
 * @param {string} downloadUrl - Download URL returned by getVideoDownloadUrl().
 */
export const downloadGeneratedVideo = async (downloadUrl) => {
  if (!downloadUrl) {
    throw new Error('Download URL is required');
  }

  const response = await fetch(downloadUrl, {
    headers: {
      ...getAuthHeaders()
    }
  });

  if (!response.ok) {
    let errorMessage = 'Failed to download video';
    try {
      const payload = await response.json();
      errorMessage = payload?.error || errorMessage;
    } catch {
      // Ignore JSON parse errors and use generic message
    }
    throw new Error(errorMessage);
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = 'generated-video.mp4';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
};

