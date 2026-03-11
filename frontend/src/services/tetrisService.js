import { getBackendApiBase } from './backendConfig';
import { getAuthHeaders } from './authService';

const SAME_ORIGIN_API_BASE = '/api';

const buildApiUrlWithBase = (base, endpoint) => {
  if (!endpoint) {
    return base;
  }

  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;

  if (normalizedEndpoint.startsWith('api/')) {
    return `${base}/${normalizedEndpoint.slice(4)}`;
  }

  return `${base}/${normalizedEndpoint}`;
};

const buildApiUrl = (endpoint) => buildApiUrlWithBase(getBackendApiBase(), endpoint);

const fetchWithFallback = async (endpoint, options) => {
  const backendBase = getBackendApiBase();
  const primaryUrl = buildApiUrl(endpoint);

  try {
    return await fetch(primaryUrl, options);
  } catch (error) {
    if (backendBase === SAME_ORIGIN_API_BASE) {
      throw error;
    }

    const fallbackUrl = buildApiUrlWithBase(SAME_ORIGIN_API_BASE, endpoint);
    return fetch(fallbackUrl, options);
  }
};

const readJson = async (response, fallbackMessage) => {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || data.message || fallbackMessage);
  }

  return data;
};

export const fetchTetrisLeaderboard = async (limit = 10) => {
  const response = await fetchWithFallback(`/games/tetris/leaderboard?limit=${encodeURIComponent(limit)}`, {
    method: 'GET'
  });
  const data = await readJson(response, 'Failed to load Tetris leaderboard');
  return data.data;
};

export const fetchTetrisProfile = async () => {
  const authHeaders = getAuthHeaders();

  if (Object.keys(authHeaders).length === 0) {
    return null;
  }

  const response = await fetchWithFallback('/games/tetris/me', {
    method: 'GET',
    headers: authHeaders
  });
  const data = await readJson(response, 'Failed to load your Tetris stats');
  return data.data;
};

export const submitTetrisScore = async ({ score, lines, level }) => {
  const authHeaders = getAuthHeaders();

  if (Object.keys(authHeaders).length === 0) {
    throw new Error('Authentication required');
  }

  const response = await fetchWithFallback('/games/tetris/score', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders
    },
    body: JSON.stringify({
      score,
      lines,
      level
    })
  });
  const data = await readJson(response, 'Failed to save Tetris score');
  return data.data;
};
