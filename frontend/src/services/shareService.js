import { getBackendApiBase } from './backendConfig';

const SAME_ORIGIN_API_BASE = '/api';
const DEFAULT_ARTIFACT_MODEL = 'gpt-5.5';

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

export const sendArtifactChat = async ({ artifactTitle, artifactId, html, prompt }) => {
  const content = typeof prompt === 'string' ? prompt.trim() : '';

  if (!content) {
    throw new Error('Prompt is required');
  }

  if (!getCurrentUserSession()?.accessToken) {
    throw new Error('Sign in to chat with this artifact');
  }

  const clippedHtml = typeof html === 'string' ? html.slice(0, 50000) : '';
  const response = await fetchWithFallback('/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders()
    },
    body: JSON.stringify({
      model: DEFAULT_ARTIFACT_MODEL,
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
    })
  });

  const data = await parseJsonResponse(response);
  return data.choices?.[0]?.message?.content || data.response || '';
};
