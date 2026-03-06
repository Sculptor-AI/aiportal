import axios from 'axios';
import { getAuthHeaders } from './authService';
import { getBackendApiBase } from './backendConfig';

const getVideoApiUrl = () => `${getBackendApiBase()}/video`;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const resolveVideoDownloadUrl = (videoRef) => {
  if (!videoRef) return '';
  if (videoRef.includes('/download?')) {
    return videoRef;
  }
  return `${getVideoApiUrl()}/download?id=${encodeURIComponent(videoRef)}`;
};

/**
 * Start a Sora video generation job.
 */
export const generateVideo = async (prompt, options = {}) => {
  try {
    const response = await axios.post(`${getVideoApiUrl()}/generate`, {
      prompt,
      aspectRatio: options.aspectRatio || '16:9',
    }, {
      headers: {
        ...getAuthHeaders()
      }
    });

    return response.data; // { success: true, videoId: 'video_...' }
  } catch (error) {
    console.error('Error generating video:', error);
    throw error.response?.data?.error || error.message || 'Failed to start video generation';
  }
};

/**
 * Poll for video generation status.
 */
export const pollVideoStatus = async (videoId) => {
  try {
    const response = await axios.get(`${getVideoApiUrl()}/status`, {
      params: { id: videoId },
      headers: {
        ...getAuthHeaders()
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error polling video status:', error);
    throw error.response?.data?.error || error.message || 'Failed to check status';
  }
};

/**
 * Wait for a Sora job to reach a terminal state.
 */
export const waitForVideoCompletion = async (videoId, options = {}) => {
  const intervalMs = options.intervalMs || 5000;
  const maxAttempts = options.maxAttempts || 120;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const status = await pollVideoStatus(videoId);
    options.onPoll?.(status);

    if (status.done) {
      return status;
    }

    await sleep(intervalMs);
  }

  throw new Error('Video generation timed out');
};

/**
 * Get the authenticated backend download URL for a video.
 */
export const getVideoDownloadUrl = (videoRef) => resolveVideoDownloadUrl(videoRef);

/**
 * Fetch the generated video as a Blob using authenticated request headers.
 */
export const fetchGeneratedVideoBlob = async (videoRef) => {
  const downloadUrl = resolveVideoDownloadUrl(videoRef);
  if (!downloadUrl) {
    throw new Error('Video reference is required');
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
      // Ignore JSON parse failures and fall back to the generic message.
    }
    throw new Error(errorMessage);
  }

  return response.blob();
};

/**
 * Create a temporary object URL for authenticated video playback.
 */
export const createVideoObjectUrl = async (videoRef) => {
  const blob = await fetchGeneratedVideoBlob(videoRef);
  return URL.createObjectURL(blob);
};

/**
 * Download a generated video using authenticated request headers.
 */
export const downloadGeneratedVideo = async (videoRef) => {
  const blob = await fetchGeneratedVideoBlob(videoRef);
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = 'generated-video.mp4';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
};
