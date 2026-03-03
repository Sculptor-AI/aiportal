export const DEFAULT_CHAT_MODEL_ID = 'gemini-3-flash';
export const DEFAULT_CUSTOM_BASE_MODEL_ID = 'chatgpt-5.3-instant';
export const TITLE_GENERATION_MODEL_ID = DEFAULT_CHAT_MODEL_ID;
export const NEWS_ASSIST_MODEL_ID = DEFAULT_CHAT_MODEL_ID;
export const GEMINI_LIVE_NATIVE_AUDIO_MODEL_ID = 'gemini-2.5-flash-preview-native-audio';

export function getPreferredModelId(models, fallbackModelId = DEFAULT_CHAT_MODEL_ID) {
  if (!Array.isArray(models) || models.length === 0) {
    return fallbackModelId;
  }

  const explicitDefault = models.find(model => model.isDefault);
  if (explicitDefault?.id) {
    return explicitDefault.id;
  }

  const fallbackModel = models.find(model => model.id === fallbackModelId);
  if (fallbackModel?.id) {
    return fallbackModel.id;
  }

  return models[0].id;
}
