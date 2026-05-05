import { Hono } from 'hono';
import { requireAuthAndApproved } from '../middleware/auth.js';
import { handleAnthropicChat } from '../services/anthropic.js';
import { handleGeminiChatNonStreaming } from '../services/gemini.js';
import { handleOpenAIChat } from '../services/openai.js';
import { handleOpenRouterChat } from '../services/openrouter.js';
import { getArtifactChatSettings } from '../utils/artifactChatSettings.js';

const shares = new Hono();

const SHARE_ID_BYTES = 16;
const MAX_TITLE_LENGTH = 120;
const MAX_CHAT_MESSAGES = 400;
const MAX_MESSAGE_LENGTH = 20000;
const MAX_ARTIFACT_HTML_LENGTH = 350000;
const MAX_ARTIFACT_CHAT_PROMPT_LENGTH = 8000;
const MAX_ARTIFACT_CHAT_HTML_CONTEXT = 50000;

const CHAT_SHARE_PREFIX = 'share:chat:';
const ARTIFACT_SHARE_PREFIX = 'share:artifact:';

const textResponse = (c, message, status = 400) => c.json({ error: message }, status);

const createShareId = () => {
  const bytes = new Uint8Array(SHARE_ID_BYTES);
  crypto.getRandomValues(bytes);

  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
};

const trimString = (value, maxLength) => {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  return trimmed.length > maxLength ? trimmed.slice(0, maxLength) : trimmed;
};

const extractTextContent = (content) => {
  if (typeof content === 'string') {
    return content;
  }

  if (!Array.isArray(content)) {
    return '';
  }

  return content
    .map((part) => {
      if (typeof part === 'string') return part;
      if (part?.type === 'text' && typeof part.text === 'string') return part.text;
      if (part?.type === 'input_text' && typeof part.text === 'string') return part.text;
      if (part?.type === 'output_text' && typeof part.text === 'string') return part.text;
      return '';
    })
    .filter(Boolean)
    .join('\n');
};

const stripUploadedFileContext = (value) => {
  if (!value) return '';

  return value
    .replace(/Previously uploaded file context:\s*<file\b[\s\S]*?<\/file>\s*(?:User Message:\s*)?/gi, '')
    .replace(/File Content:\s*---[\s\S]*?---\s*User Message:\s*/gi, '')
    .replace(/<file\b[^>]*>[\s\S]*?<\/file>/gi, '')
    .replace(/!\[[^\]]*\]\((?:data:|blob:)[^)]+\)/gi, '[image removed]')
    .replace(/data:[a-z0-9.+/-]+\/[a-z0-9.+-]+;base64,[a-z0-9+/=]+/gi, '[attachment removed]')
    .trim();
};

const sanitizeSharedMessages = (messages) => {
  if (!Array.isArray(messages)) return [];

  return messages
    .slice(0, MAX_CHAT_MESSAGES)
    .map((message) => {
      const role = message?.role === 'assistant' ? 'assistant' : message?.role === 'user' ? 'user' : null;
      if (!role) return null;

      const content = trimString(stripUploadedFileContext(extractTextContent(message.content)), MAX_MESSAGE_LENGTH);
      if (!content) return null;

      return {
        id: typeof message.id === 'string' ? trimString(message.id, 80) : undefined,
        role,
        content,
        createdAt: typeof message.createdAt === 'string' ? message.createdAt : undefined,
        timestamp: typeof message.timestamp === 'string' ? message.timestamp : undefined,
        model: typeof message.model === 'string' ? trimString(message.model, 120) : undefined
      };
    })
    .filter(Boolean);
};

const getShareUrl = (c, path) => {
  const origin = new URL(c.req.url).origin;
  return `${origin}${path}`;
};

const getProviderForModel = (modelId, providerHint) => {
  if (providerHint === 'gemini' || providerHint === 'anthropic' || providerHint === 'openai' || providerHint === 'openrouter') {
    return providerHint;
  }

  if (modelId?.startsWith('gemini') || modelId?.startsWith('google/')) return 'gemini';
  if (modelId?.startsWith('claude') || modelId?.startsWith('anthropic/')) return 'anthropic';
  if (modelId?.startsWith('gpt') || modelId?.startsWith('chatgpt') || modelId?.startsWith('o1') || modelId?.startsWith('o3') || modelId?.startsWith('o4') || modelId?.startsWith('openai/')) return 'openai';
  return 'openrouter';
};

const getArtifactChatContent = async (c, body, artifact, settings) => {
  const model = settings.model;
  const provider = getProviderForModel(model, settings.provider);
  const clippedHtml = typeof artifact.html === 'string'
    ? artifact.html.slice(0, MAX_ARTIFACT_CHAT_HTML_CONTEXT)
    : '';
  const requestBody = {
    model,
    provider,
    stream: false,
    messages: [{
      role: 'user',
      content:
        `You are helping inside a Sculptor interactive artifact.\n` +
        `Artifact title: ${artifact.title || 'Untitled artifact'}\n` +
        `Artifact id: ${artifact.id || 'local'}\n\n` +
        `Artifact HTML, clipped for context:\n${clippedHtml}\n\n` +
        `User request:\n${body.prompt}`
    }]
  };

  let response;
  if (provider === 'gemini') {
    if (!c.env.GEMINI_API_KEY) return textResponse(c, 'GEMINI_API_KEY is not configured.', 500);
    response = await handleGeminiChatNonStreaming(c, requestBody, c.env.GEMINI_API_KEY);
  } else if (provider === 'anthropic') {
    if (!c.env.ANTHROPIC_API_KEY) return textResponse(c, 'ANTHROPIC_API_KEY is not configured.', 500);
    response = await handleAnthropicChat(c, requestBody, c.env.ANTHROPIC_API_KEY);
  } else if (provider === 'openai') {
    if (!c.env.OPENAI_API_KEY) return textResponse(c, 'OPENAI_API_KEY is not configured.', 500);
    response = await handleOpenAIChat(c, requestBody, c.env.OPENAI_API_KEY);
  } else {
    if (!c.env.OPENROUTER_API_KEY) return textResponse(c, 'OPENROUTER_API_KEY is not configured.', 500);
    response = await handleOpenRouterChat(c, requestBody, c.env.OPENROUTER_API_KEY);
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    return c.json({
      error: payload?.error || payload?.message || 'Artifact AI request failed',
      provider,
      upstream_status: response.status
    }, response.status);
  }

  return c.json({
    content: payload?.choices?.[0]?.message?.content || payload?.response || '',
    model,
    provider
  });
};

shares.post('/chats', requireAuthAndApproved, async (c) => {
  const kv = c.env.KV;
  const user = c.get('user');

  if (!kv) {
    return textResponse(c, 'Storage not configured', 500);
  }

  const body = await c.req.json().catch(() => null);
  const chat = body?.chat || body || {};
  const messages = sanitizeSharedMessages(chat.messages || body?.messages);

  if (messages.length === 0) {
    return textResponse(c, 'No shareable text messages found');
  }

  const id = createShareId();
  const record = {
    id,
    type: 'chat',
    title: trimString(chat.title || body?.title || 'Shared chat', MAX_TITLE_LENGTH) || 'Shared chat',
    messages,
    createdAt: new Date().toISOString(),
    ownerUserId: user.id
  };

  await kv.put(`${CHAT_SHARE_PREFIX}${id}`, JSON.stringify(record));

  return c.json({
    id,
    url: getShareUrl(c, `/share/${id}`),
    data: record
  });
});

shares.get('/chats/:id', async (c) => {
  const kv = c.env.KV;
  const id = c.req.param('id');

  if (!kv) {
    return textResponse(c, 'Storage not configured', 500);
  }

  const record = await kv.get(`${CHAT_SHARE_PREFIX}${id}`, 'json');
  if (!record) {
    return textResponse(c, 'Shared chat not found', 404);
  }

  const { ownerUserId, ...publicRecord } = record;
  return c.json(publicRecord);
});

shares.post('/artifacts', requireAuthAndApproved, async (c) => {
  const kv = c.env.KV;
  const user = c.get('user');

  if (!kv) {
    return textResponse(c, 'Storage not configured', 500);
  }

  const body = await c.req.json().catch(() => null);
  const html = typeof body?.html === 'string' ? body.html.trim() : '';

  if (!html) {
    return textResponse(c, 'Artifact HTML is required');
  }

  if (html.length > MAX_ARTIFACT_HTML_LENGTH) {
    return textResponse(c, `Artifact HTML must be ${MAX_ARTIFACT_HTML_LENGTH} characters or less`, 413);
  }

  const id = createShareId();
  const record = {
    id,
    type: 'artifact',
    title: trimString(body.title || 'Sculptor artifact', MAX_TITLE_LENGTH) || 'Sculptor artifact',
    html,
    sourceChatId: typeof body.sourceChatId === 'string' ? trimString(body.sourceChatId, 120) : undefined,
    sourceMessageId: typeof body.sourceMessageId === 'string' ? trimString(body.sourceMessageId, 120) : undefined,
    allowModelChat: body.allowModelChat !== false,
    createdAt: new Date().toISOString(),
    ownerUserId: user.id
  };

  await kv.put(`${ARTIFACT_SHARE_PREFIX}${id}`, JSON.stringify(record));

  return c.json({
    id,
    url: getShareUrl(c, `/artifact/${id}`),
    data: {
      ...record,
      ownerUserId: undefined
    }
  });
});

shares.get('/artifacts/:id', async (c) => {
  const kv = c.env.KV;
  const id = c.req.param('id');

  if (!kv) {
    return textResponse(c, 'Storage not configured', 500);
  }

  const record = await kv.get(`${ARTIFACT_SHARE_PREFIX}${id}`, 'json');
  if (!record) {
    return textResponse(c, 'Shared artifact not found', 404);
  }

  const { ownerUserId, ...publicRecord } = record;
  return c.json({
    ...publicRecord,
    allowModelChat: record.allowModelChat !== false
  });
});

shares.post('/artifacts/:id/chat', requireAuthAndApproved, async (c) => {
  const kv = c.env.KV;
  const id = c.req.param('id');

  if (!kv) {
    return textResponse(c, 'Storage not configured', 500);
  }

  const artifact = await kv.get(`${ARTIFACT_SHARE_PREFIX}${id}`, 'json');
  if (!artifact) {
    return textResponse(c, 'Shared artifact not found', 404);
  }

  if (artifact.allowModelChat === false) {
    return textResponse(c, 'Model chat is disabled for this artifact.', 403);
  }

  const body = await c.req.json().catch(() => ({}));
  const prompt = typeof body?.prompt === 'string' ? body.prompt.trim() : '';
  if (!prompt || prompt.length > MAX_ARTIFACT_CHAT_PROMPT_LENGTH) {
    return textResponse(c, `Artifact chat prompts must be between 1 and ${MAX_ARTIFACT_CHAT_PROMPT_LENGTH} characters.`);
  }

  const settings = await getArtifactChatSettings(kv);
  return getArtifactChatContent(c, { prompt }, artifact, settings);
});

export default shares;
