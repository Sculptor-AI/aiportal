const DEEP_RESEARCH_SETTINGS_KEY = 'settings:deep-research';

export const DEEP_RESEARCH_SETTINGS_DEFAULTS = Object.freeze({
  plannerModel: 'gemini-3.1-pro',
  researcherModel: 'gemini-3-flash',
  writerModel: 'claude-sonnet-4.6',
  reportLength: 'standard',
  reportDepth: 'standard',
  minAgents: 2,
  maxAgents: 12,
  defaultMaxAgents: 8,
  maxParallelAgents: 4,
  plannerMaxTokens: 2048,
  agentMaxTokens: 3072,
  writerMaxTokens: 8192,
  plannerTemperature: 0.2,
  agentTemperature: 0.2,
  writerTemperature: 0.2,
  requestTimeoutMs: 180000,
  allowWriterModelOverride: false
});

const REPORT_LENGTH_OPTIONS = new Set(['short', 'standard', 'long']);
const REPORT_DEPTH_OPTIONS = new Set(['surface', 'standard', 'deep']);

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const parseIntValue = (value, min, max, fieldName) => {
  if (value === undefined || value === null || value === '') return null;
  const parsed = toNumber(value);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new Error(`${fieldName} must be an integer between ${min} and ${max}.`);
  }
  return parsed;
};

const parseFloatValue = (value, min, max, fieldName) => {
  if (value === undefined || value === null || value === '') return null;
  const parsed = toNumber(value);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    throw new Error(`${fieldName} must be a number between ${min} and ${max}.`);
  }
  return parsed;
};

const parseStringChoice = (value, options, fieldName) => {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string') {
    throw new Error(`${fieldName} must be a string.`);
  }
  const normalized = value.trim().toLowerCase();
  if (!options.has(normalized)) {
    throw new Error(`${fieldName} must be one of: ${[...options].join(', ')}.`);
  }
  return normalized;
};

const parseBoolean = (value, fieldName) => {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value === 'boolean') return value;
  if (typeof value !== 'string') {
    throw new Error(`${fieldName} must be a boolean.`);
  }
  const normalized = value.trim().toLowerCase();
  if (normalized === 'true' || normalized === '1' || normalized === 'yes') return true;
  if (normalized === 'false' || normalized === '0' || normalized === 'no') return false;
  throw new Error(`${fieldName} must be true/false.`);
};

const parseModelName = (value, fieldName) => {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string') {
    throw new Error(`${fieldName} must be a model name string.`);
  }
  const normalized = value.trim();
  if (!normalized) {
    throw new Error(`${fieldName} must not be blank.`);
  }
  return normalized;
};

export const normalizeDeepResearchSettings = (rawSettings = {}) => {
  const defaults = DEEP_RESEARCH_SETTINGS_DEFAULTS;

  const plannerModel = parseModelName(
    rawSettings.plannerModel,
    'plannerModel'
  ) || defaults.plannerModel;

  const researcherModel = parseModelName(
    rawSettings.researcherModel,
    'researcherModel'
  ) || defaults.researcherModel;

  const writerModel = parseModelName(
    rawSettings.writerModel,
    'writerModel'
  ) || defaults.writerModel;

  const reportLength = parseStringChoice(
    rawSettings.reportLength,
    REPORT_LENGTH_OPTIONS,
    'reportLength'
  ) || defaults.reportLength;

  const reportDepth = parseStringChoice(
    rawSettings.reportDepth,
    REPORT_DEPTH_OPTIONS,
    'reportDepth'
  ) || defaults.reportDepth;

  const minAgents = parseIntValue(rawSettings.minAgents, 1, 24, 'minAgents') ?? defaults.minAgents;
  const maxAgents = parseIntValue(rawSettings.maxAgents, 1, 24, 'maxAgents') ?? defaults.maxAgents;
  const defaultMaxAgents = parseIntValue(rawSettings.defaultMaxAgents, 1, 24, 'defaultMaxAgents') ?? defaults.defaultMaxAgents;
  const maxParallelAgents = parseIntValue(rawSettings.maxParallelAgents, 1, Math.max(1, maxAgents), 'maxParallelAgents') ?? defaults.maxParallelAgents;
  const plannerMaxTokens = parseIntValue(rawSettings.plannerMaxTokens, 256, 8192, 'plannerMaxTokens') ?? defaults.plannerMaxTokens;
  const agentMaxTokens = parseIntValue(rawSettings.agentMaxTokens, 256, 8192, 'agentMaxTokens') ?? defaults.agentMaxTokens;
  const writerMaxTokens = parseIntValue(rawSettings.writerMaxTokens, 512, 16384, 'writerMaxTokens') ?? defaults.writerMaxTokens;
  const plannerTemperature = parseFloatValue(rawSettings.plannerTemperature, 0, 1, 'plannerTemperature') ?? defaults.plannerTemperature;
  const agentTemperature = parseFloatValue(rawSettings.agentTemperature, 0, 1, 'agentTemperature') ?? defaults.agentTemperature;
  const writerTemperature = parseFloatValue(rawSettings.writerTemperature, 0, 1, 'writerTemperature') ?? defaults.writerTemperature;
  const requestTimeoutMs = parseIntValue(rawSettings.requestTimeoutMs, 5000, 300000, 'requestTimeoutMs') ?? defaults.requestTimeoutMs;
  const allowWriterModelOverride = parseBoolean(rawSettings.allowWriterModelOverride, 'allowWriterModelOverride');

  const normalizedMinAgents = Math.max(1, Math.min(minAgents, 24));
  const normalizedMaxAgents = Math.max(normalizedMinAgents, Math.min(maxAgents, 24));
  const normalizedDefaultMaxAgents = Math.max(
    normalizedMinAgents,
    Math.min(defaultMaxAgents, normalizedMaxAgents)
  );
  const normalizedMaxParallelAgents = Math.max(
    1,
    Math.min(maxParallelAgents, normalizedDefaultMaxAgents)
  );

  return {
    plannerModel,
    researcherModel,
    writerModel,
    reportLength,
    reportDepth,
    minAgents: normalizedMinAgents,
    maxAgents: normalizedMaxAgents,
    defaultMaxAgents: normalizedDefaultMaxAgents,
    maxParallelAgents: normalizedMaxParallelAgents,
    plannerMaxTokens,
    agentMaxTokens,
    writerMaxTokens,
    plannerTemperature,
    agentTemperature,
    writerTemperature,
    requestTimeoutMs,
    allowWriterModelOverride: allowWriterModelOverride === null
      ? defaults.allowWriterModelOverride
      : allowWriterModelOverride
  };
};

export const getDeepResearchSettings = async (kv) => {
  if (!kv) {
    return { ...DEEP_RESEARCH_SETTINGS_DEFAULTS };
  }

  try {
    const stored = await kv.get(DEEP_RESEARCH_SETTINGS_KEY, 'json');
    return {
      ...DEEP_RESEARCH_SETTINGS_DEFAULTS,
      ...normalizeDeepResearchSettings(stored || {})
    };
  } catch (error) {
    console.error('Error reading deep research settings:', error);
    return { ...DEEP_RESEARCH_SETTINGS_DEFAULTS };
  }
};

export const updateDeepResearchSettings = async (kv, rawSettings = {}) => {
  if (!kv) {
    throw new Error('Storage not configured');
  }

  const current = await getDeepResearchSettings(kv);
  const next = normalizeDeepResearchSettings({
    ...current,
    ...rawSettings
  });

  await kv.put(DEEP_RESEARCH_SETTINGS_KEY, JSON.stringify(next));
  return next;
};

export const getDeepResearchSettingsKey = () => DEEP_RESEARCH_SETTINGS_KEY;

export default {
  getDeepResearchSettings,
  updateDeepResearchSettings,
  normalizeDeepResearchSettings,
  DEEP_RESEARCH_SETTINGS_DEFAULTS,
  getDeepResearchSettingsKey
};
