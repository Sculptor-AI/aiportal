const SAME_ORIGIN_API_BASE = '/api';
const BACKEND_MODE_STORAGE_KEY = 'sculptorBackendMode';
const DEFAULT_USE_REAL_BACKEND = true;

const cleanBaseUrl = (rawBaseUrl) => {
  let base = (rawBaseUrl || '').trim().replace(/\/+$/, '');

  if (base.endsWith('/api')) {
    base = base.slice(0, -4);
  }

  return base;
};

const getRemoteRoot = () => cleanBaseUrl(import.meta.env.VITE_BACKEND_API_URL || '');

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

const toWebSocketUrl = (httpBase) => {
  if (httpBase.startsWith('https://')) {
    return httpBase.replace('https://', 'wss://');
  }

  if (httpBase.startsWith('http://')) {
    return httpBase.replace('http://', 'ws://');
  }

  return httpBase;
};

const getCurrentOriginBase = () => {
  if (typeof window === 'undefined' || !window.location) {
    return 'http://localhost:3000';
  }

  return `${window.location.protocol}//${window.location.host}`;
};

export const getBackendLiveSocketUrl = () => {
  const base = shouldUseRealBackend()
    ? (getRemoteRoot() || getCurrentOriginBase())
    : getCurrentOriginBase();

  return `${toWebSocketUrl(base)}/api/v1/live`;
};
