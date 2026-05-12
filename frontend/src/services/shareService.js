import { getBackendApiBase } from './backendConfig';

const SAME_ORIGIN_API_BASE = '/api';
const buildApiUrlWithBase = (base, endpoint) => {
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;

  if (normalizedEndpoint.startsWith('api/')) {
    return `${base}/${normalizedEndpoint.substring(4)}`;
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

    return fetch(buildApiUrlWithBase(SAME_ORIGIN_API_BASE, endpoint), options);
  }
};

const getCurrentUserSession = () => {
  try {
    const raw = localStorage.getItem('ai_portal_current_user');
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error('Error reading current user session:', error);
    return null;
  }
};

export const isShareChatAvailable = () => Boolean(getCurrentUserSession()?.accessToken);

export const buildAuthHeaders = () => {
  const token = getCurrentUserSession()?.accessToken;

  if (!token) {
    return {};
  }

  if (token.startsWith('ak_')) {
    return { 'X-API-Key': token };
  }

  return { Authorization: `Bearer ${token}` };
};

export class AuthRequiredError extends Error {
  constructor(message = 'Sign in to chat with this artifact') {
    super(message);
    this.name = 'AuthRequiredError';
    this.code = 'auth_required';
  }
}

const normalizePublicShareUrl = (rawUrl, fallbackPath) => {
  const path = fallbackPath || '/';

  if (typeof window === 'undefined') {
    return rawUrl || path;
  }

  try {
    if (rawUrl) {
      const parsed = new URL(rawUrl, window.location.origin);
      return `${window.location.origin}${parsed.pathname}${parsed.search}${parsed.hash}`;
    }
  } catch (error) {
    console.warn('Could not normalize share URL:', error);
  }

  return `${window.location.origin}${path}`;
};

export const getSharedChatUrl = (shareResult) => normalizePublicShareUrl(
  shareResult?.url,
  shareResult?.id ? `/share/${encodeURIComponent(shareResult.id)}` : '/share'
);

export const getSharedArtifactUrl = (shareResult) => normalizePublicShareUrl(
  shareResult?.url,
  shareResult?.id ? `/artifact/${encodeURIComponent(shareResult.id)}` : '/artifact'
);

export const getSharedModelUrl = (shareResult) => normalizePublicShareUrl(
  shareResult?.url,
  shareResult?.id ? `/model/${encodeURIComponent(shareResult.id)}` : '/model'
);

export const copyToClipboard = async (text) => {
  if (typeof text !== 'string' || !text) {
    return false;
  }

  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      console.warn('Clipboard API failed, attempting execCommand fallback:', error);
    }
  }

  if (typeof document === 'undefined') {
    return false;
  }

  let textarea;
  try {
    textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.top = '0';
    textarea.style.left = '0';
    textarea.style.width = '1px';
    textarea.style.height = '1px';
    textarea.style.opacity = '0';
    textarea.style.pointerEvents = 'none';
    document.body.appendChild(textarea);

    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, text.length);

    return document.execCommand('copy');
  } catch (error) {
    console.error('Fallback clipboard copy failed:', error);
    return false;
  } finally {
    if (textarea && textarea.parentNode) {
      textarea.parentNode.removeChild(textarea);
    }
  }
};

const parseJsonResponse = async (response) => {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || data.message || `Request failed with status ${response.status}`);
  }

  return data;
};

export const createSharedChat = async (chat) => {
  const response = await fetchWithFallback('/shares/chats', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders()
    },
    body: JSON.stringify({ chat })
  });

  return parseJsonResponse(response);
};

export const fetchSharedChat = async (shareId) => {
  const response = await fetchWithFallback(`/shares/chats/${encodeURIComponent(shareId)}`, {
    method: 'GET'
  });

  return parseJsonResponse(response);
};

export const createSharedArtifact = async ({ title, html, sourceChatId, sourceMessageId, allowModelChat = true }) => {
  const response = await fetchWithFallback('/shares/artifacts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders()
    },
    body: JSON.stringify({
      title,
      html,
      sourceChatId,
      sourceMessageId,
      allowModelChat
    })
  });

  return parseJsonResponse(response);
};

export const fetchSharedArtifact = async (artifactId) => {
  const response = await fetchWithFallback(`/shares/artifacts/${encodeURIComponent(artifactId)}`, {
    method: 'GET'
  });

  return parseJsonResponse(response);
};

export const createSharedModel = async (model) => {
  const response = await fetchWithFallback('/shares/models', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders()
    },
    body: JSON.stringify({ model })
  });

  return parseJsonResponse(response);
};

export const fetchSharedModel = async (shareId) => {
  const response = await fetchWithFallback(`/shares/models/${encodeURIComponent(shareId)}`, {
    method: 'GET'
  });

  return parseJsonResponse(response);
};

export const sendArtifactChat = async ({ artifactTitle, artifactId, html, prompt, shared = false }) => {
  const content = typeof prompt === 'string' ? prompt.trim() : '';

  if (!content) {
    throw new Error('Prompt is required');
  }

  if (!getCurrentUserSession()?.accessToken) {
    throw new AuthRequiredError();
  }

  const sharedArtifactId = shared && typeof artifactId === 'string' && artifactId
    ? artifactId
    : null;

  const endpoint = sharedArtifactId
    ? `/shares/artifacts/${encodeURIComponent(sharedArtifactId)}/chat`
    : '/v1/chat/completions';

  const clippedHtml = typeof html === 'string' ? html.slice(0, 50000) : '';
  const body = sharedArtifactId
    ? { prompt: content }
    : {
        model: 'gpt-5.4-mini',
        provider: 'openai',
        stream: false,
        messages: [
          {
            role: 'user',
            content:
              `You are helping inside a Sculptor interactive artifact.\n` +
              `Artifact title: ${artifactTitle || 'Untitled artifact'}\n` +
              `Artifact id: ${artifactId || 'local'}\n\n` +
              `Artifact HTML, clipped for context:\n${clippedHtml}\n\n` +
              `User request:\n${content}`
          }
        ]
      };

  const response = await fetchWithFallback(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders()
    },
    body: JSON.stringify(body)
  });

  if (response.status === 401 || response.status === 403) {
    const data = await response.json().catch(() => ({}));
    if ((data.error || '').toLowerCase().includes('auth') || response.status === 401) {
      throw new AuthRequiredError(data.error || data.message || undefined);
    }
  }

  const data = await parseJsonResponse(response);
  return data.content || data.choices?.[0]?.message?.content || data.response || '';
};
