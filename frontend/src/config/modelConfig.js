export const DEFAULT_CHAT_MODEL_ID = 'gpt-5.4-mini';
export const THINKING_PREVIEW_TIMER_ENABLED = true;
export const THINKING_PREVIEW_TIMER_MIN_REASONING_EFFORT = 'medium';

const REASONING_EFFORT_RANKS = {
  none: 0,
  minimal: 1,
  low: 2,
  medium: 3,
  high: 4,
  xhigh: 5,
  max: 6
};

export function isReasoningEffortAboveMedium(reasoningEffort) {
  const normalizedEffort = typeof reasoningEffort === 'string'
    ? reasoningEffort.trim().toLowerCase()
    : '';
  return (REASONING_EFFORT_RANKS[normalizedEffort] || 0) > (REASONING_EFFORT_RANKS[THINKING_PREVIEW_TIMER_MIN_REASONING_EFFORT] || REASONING_EFFORT_RANKS.medium);
}

export const DEFAULT_CUSTOM_BASE_MODEL_ID = 'gpt-5.5';
// Pinned to a small, cheap, non-thinking model so chat title summarization stays
// fast and doesn't drift when DEFAULT_CHAT_MODEL_ID changes.
export const TITLE_GENERATION_MODEL_ID = 'gemini-3.1-flash-lite';
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
