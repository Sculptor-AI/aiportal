export const DEFAULT_CHAT_MODEL_ID = 'gemini-3-flash';
export const DEFAULT_CUSTOM_BASE_MODEL_ID = 'chatgpt-5.4-thinking';
export const TITLE_GENERATION_MODEL_ID = DEFAULT_CHAT_MODEL_ID;
export const NEWS_ASSIST_MODEL_ID = DEFAULT_CHAT_MODEL_ID;
export const DEEP_RESEARCH_MODEL_ID = 'deep-research';

export const DEEP_RESEARCH_MODEL = {
  id: DEEP_RESEARCH_MODEL_ID,
  name: 'Deep research',
  description: 'Planner + parallel research agents + synthesis report',
  provider: 'Research pipeline',
  capabilities: {},
  isBackendModel: true,
  source: 'deep-research',
  isSynthetic: true
};

export function appendDeepResearchModel(models) {
  const list = Array.isArray(models) ? models : [];
  if (list.some(model => model?.id === DEEP_RESEARCH_MODEL_ID)) {
    return list;
  }
  return [...list, DEEP_RESEARCH_MODEL];
}

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
