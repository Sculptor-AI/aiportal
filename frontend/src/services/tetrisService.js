import { getBackendApiBase } from './backendConfig';
import { getAuthHeaders } from './authService';

const SAME_ORIGIN_API_BASE = '/api';
const LOCALHOST_HOSTNAMES = new Set(['localhost', '127.0.0.1', '0.0.0.0']);

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

const isLocalRuntime = () => {
  if (typeof window === 'undefined' || !window.location) {
    return false;
  }

  return LOCALHOST_HOSTNAMES.has(window.location.hostname);
};

const shouldRetrySameOrigin = (response, backendBase) => {
  if (backendBase === SAME_ORIGIN_API_BASE || !isLocalRuntime()) {
    return false;
  }

  return response.status === 404 || response.status >= 500;
};

const fetchWithFallback = async (endpoint, options) => {
  const backendBase = getBackendApiBase();
  const primaryUrl = buildApiUrl(endpoint);
  const fallbackUrl = buildApiUrlWithBase(SAME_ORIGIN_API_BASE, endpoint);

  try {
    const response = await fetch(primaryUrl, options);

    if (!shouldRetrySameOrigin(response, backendBase)) {
      return response;
    }
  } catch (error) {
    if (backendBase === SAME_ORIGIN_API_BASE) {
      throw error;
    }
  }

  return fetch(fallbackUrl, options);
};

const readJson = async (response, fallbackMessage) => {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || data.message || fallbackMessage);
  }

  return data;
};

export const fetchTetrisLeaderboard = async (limit = 10) => {
  // Send auth headers if available so the endpoint works against deployments
  // that still require auth on the public leaderboard route.
  const authHeaders = getAuthHeaders();
  const response = await fetchWithFallback(`/games/tetris/leaderboard?limit=${encodeURIComponent(limit)}`, {
    method: 'GET',
    headers: Object.keys(authHeaders).length > 0 ? authHeaders : undefined
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
