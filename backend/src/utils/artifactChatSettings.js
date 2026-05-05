const ARTIFACT_CHAT_SETTINGS_KEY = 'settings:artifact_chat';

export const DEFAULT_ARTIFACT_CHAT_SETTINGS = Object.freeze({
  model: 'gpt-5.4-mini',
  provider: 'openai'
});

const normalizeProvider = (value) => {
  const provider = typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (['openai', 'openrouter', 'gemini', 'google', 'anthropic', 'claude'].includes(provider)) {
    if (provider === 'google') return 'gemini';
    if (provider === 'claude') return 'anthropic';
    return provider;
  }
  return DEFAULT_ARTIFACT_CHAT_SETTINGS.provider;
};

export const normalizeArtifactChatSettings = (value = {}) => {
  const model = typeof value.model === 'string' && value.model.trim()
    ? value.model.trim().slice(0, 160)
    : DEFAULT_ARTIFACT_CHAT_SETTINGS.model;

  return {
    model,
    provider: normalizeProvider(value.provider)
  };
};

export const getArtifactChatSettings = async (kv) => {
  if (!kv) return { ...DEFAULT_ARTIFACT_CHAT_SETTINGS };
  const stored = await kv.get(ARTIFACT_CHAT_SETTINGS_KEY, 'json').catch(() => null);
  return normalizeArtifactChatSettings(stored || DEFAULT_ARTIFACT_CHAT_SETTINGS);
};

export const updateArtifactChatSettings = async (kv, value = {}) => {
  if (!kv) {
    throw new Error('Storage not configured');
  }

  const settings = normalizeArtifactChatSettings(value);
  await kv.put(ARTIFACT_CHAT_SETTINGS_KEY, JSON.stringify(settings));
  return settings;
};
