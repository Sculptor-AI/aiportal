const SAME_ORIGIN_API_BASE = '/api';
const BACKEND_MODE_STORAGE_KEY = 'sculptorBackendMode';
const DEFAULT_USE_REAL_BACKEND = true;
const DEFAULT_REMOTE_BACKEND_URL = 'https://api.sculptorai.org';
const LOCALHOST_HOSTNAMES = new Set(['localhost', '127.0.0.1', '0.0.0.0']);

const cleanBaseUrl = (rawBaseUrl) => {
  let base = (rawBaseUrl || '').trim().replace(/\/+$/, '');

  if (base.endsWith('/api')) {
    base = base.slice(0, -4);
  }

  return base;
};

const isLocalUrl = (rawUrl) => {
  if (!rawUrl) return false;

  try {
    const { hostname } = new URL(rawUrl);
    return LOCALHOST_HOSTNAMES.has(hostname);
  } catch (error) {
    return false;
  }
};

const isHostedRuntime = () => {
  if (typeof window === 'undefined' || !window.location) {
    return false;
  }

  return !LOCALHOST_HOSTNAMES.has(window.location.hostname);
};

const getRemoteRoot = () => {
  // On hosted deployments, prefer the same origin worker/API so the frontend
  // and backend stay on the same release and avoid cross-origin auth/CORS issues.
  if (isHostedRuntime()) {
    return '';
  }

  const configuredRemoteRoot = cleanBaseUrl(import.meta.env.VITE_REMOTE_BACKEND_URL || '');
  if (configuredRemoteRoot) {
    return configuredRemoteRoot;
  }

  const legacyBackendRoot = cleanBaseUrl(import.meta.env.VITE_BACKEND_API_URL || '');
  if (legacyBackendRoot && !isLocalUrl(legacyBackendRoot)) {
    return legacyBackendRoot;
  }

  return DEFAULT_REMOTE_BACKEND_URL;
};

const readStoredMode = () => {
  try {
    if (typeof localStorage === 'undefined') return undefined;

    const rawMode = localStorage.getItem(BACKEND_MODE_STORAGE_KEY);
    if (!rawMode) return undefined;

    const mode = rawMode.toLowerCase();

    if (mode === 'remote' || mode === '1' || mode === 'true') {
      return true;
    }

    if (mode === 'local' || mode === '0' || mode === 'false') {
      return false;
    }
  } catch (error) {
    console.warn('[backendConfig] Failed to read backend mode setting from localStorage:', error);
  }

  return undefined;
};

export const shouldUseRealBackend = () => {
  const storedMode = readStoredMode();
  return typeof storedMode === 'boolean' ? storedMode : DEFAULT_USE_REAL_BACKEND;
};

export const setBackendMode = (useRealBackend) => {
  try {
    if (typeof localStorage === 'undefined') return;

    localStorage.setItem(
      BACKEND_MODE_STORAGE_KEY,
      useRealBackend ? 'remote' : 'local'
    );
  } catch (error) {
    console.warn('[backendConfig] Failed to save backend mode setting:', error);
  }
};

export const getRemoteApiBase = () => {
  const remoteRoot = getRemoteRoot();
  return remoteRoot ? `${remoteRoot}/api` : SAME_ORIGIN_API_BASE;
};

export const getBackendApiBase = () => {
  return shouldUseRealBackend() ? getRemoteApiBase() : SAME_ORIGIN_API_BASE;
};

export const getRemoteBackendHost = () => getRemoteRoot();
