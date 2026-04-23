/**
 * Deep research configuration.
 *
 * Centralizes defaults and environment-driven overrides for the
 * planner -> researcher agents -> final writer pipeline.
 */

import { listChatModels, resolveModel } from './index.js';
import { DEEP_RESEARCH_SETTINGS_DEFAULTS } from '../utils/deepResearchSettings.js';

const DEFAULTS = {
  enabled: true,
  ...DEEP_RESEARCH_SETTINGS_DEFAULTS
};

const parseBoolean = (value, fallback) => {
  if (value === undefined || value === null || value === '') return fallback;
  const normalized = String(value).trim().toLowerCase();
  if (normalized === 'true' || normalized === '1' || normalized === 'yes') return true;
  if (normalized === 'false' || normalized === '0' || normalized === 'no') return false;
  return fallback;
};

const parseInteger = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return parsed;
};

const parseFloatNumber = (value, fallback) => {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) return fallback;
  return parsed;
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const clampInteger = (value, min, max) => clamp(Math.round(value), min, max);

const normalizeReportLength = (value, fallback) => {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value !== 'string') return fallback;
  const normalized = value.trim().toLowerCase();
  if (['short', 'standard', 'long'].includes(normalized)) return normalized;
  return fallback;
};

const normalizeReportDepth = (value, fallback) => {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value !== 'string') return fallback;
  const normalized = value.trim().toLowerCase();
  if (['surface', 'standard', 'deep'].includes(normalized)) return normalized;
  return fallback;
};

const sanitizeModelName = (model) => {
  if (!model || typeof model !== 'string') return '';
  return model.trim();
};

const getAllowedModelsForProvider = (provider) => {
  return listChatModels()
    .filter((model) => model?.provider === provider)
    .map((model) => model.id);
};

const sanitizeAllowedModel = (value, provider, fallback) => {
  const normalized = sanitizeModelName(value);
  if (!normalized) return fallback;
  const allowedModels = getAllowedModelsForProvider(provider);
  if (allowedModels.includes(normalized)) return normalized;
  return fallback;
};

const isAllowedWriterModelOverride = (model) => {
  if (!model || typeof model !== 'string') return false;
  const normalized = model.trim().toLowerCase();
  return normalized.startsWith('claude') || normalized.startsWith('anthropic/');
};

const sanitizeAgentCountOverride = (value, min, max, fallback) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return clampInteger(parsed, min, max);
};

export const getDeepResearchConfig = (env = {}, requestBody = {}, storedConfig = {}) => {
  const enabled = parseBoolean(env.DEEP_RESEARCH_ENABLED, DEFAULTS.enabled);

  const plannerModel = sanitizeAllowedModel(
    sanitizeModelName(storedConfig.plannerModel) || env.DEEP_RESEARCH_PLANNER_MODEL || DEFAULTS.plannerModel,
    'gemini',
    DEFAULTS.plannerModel
  );
  const researcherModel = sanitizeAllowedModel(
    sanitizeModelName(storedConfig.researcherModel) || env.DEEP_RESEARCH_RESEARCHER_MODEL || DEFAULTS.researcherModel,
    'gemini',
    DEFAULTS.researcherModel
  );
  const defaultWriterModel = sanitizeAllowedModel(
    sanitizeModelName(storedConfig.writerModel) || env.DEEP_RESEARCH_WRITER_MODEL || DEFAULTS.writerModel,
    'anthropic',
    DEFAULTS.writerModel
  );
  const reportLength = normalizeReportLength(
    requestBody.reportLength || storedConfig.reportLength || env.DEEP_RESEARCH_REPORT_LENGTH,
    DEFAULTS.reportLength
  );
  const reportDepth = normalizeReportDepth(
    requestBody.reportDepth || storedConfig.reportDepth || env.DEEP_RESEARCH_REPORT_DEPTH,
    DEFAULTS.reportDepth
  );

  const minAgents = sanitizeAgentCountOverride(
    requestBody.minAgents ?? storedConfig.minAgents ?? env.DEEP_RESEARCH_MIN_AGENTS,
    1,
    24,
    DEFAULTS.minAgents
  );
  const maxAgents = sanitizeAgentCountOverride(
    requestBody.maxAgents ?? storedConfig.maxAgents ?? env.DEEP_RESEARCH_MAX_AGENTS,
    minAgents,
    24,
    DEFAULTS.maxAgents
  );
  const defaultMaxAgents = sanitizeAgentCountOverride(
    requestBody.defaultMaxAgents ?? storedConfig.defaultMaxAgents ?? env.DEEP_RESEARCH_DEFAULT_MAX_AGENTS,
    minAgents,
    maxAgents,
    DEFAULTS.defaultMaxAgents
  );

  const maxParallelAgents = sanitizeAgentCountOverride(
    requestBody.maxParallelAgents ?? storedConfig.maxParallelAgents ?? env.DEEP_RESEARCH_MAX_PARALLEL_AGENTS,
    1,
    maxAgents,
    DEFAULTS.maxParallelAgents
  );

  const plannerMaxTokens = clampInteger(
    parseInteger(
      requestBody.plannerMaxTokens ?? storedConfig.plannerMaxTokens ?? env.DEEP_RESEARCH_PLANNER_MAX_TOKENS,
      DEFAULTS.plannerMaxTokens
    ),
    256,
    8192
  );
  const agentMaxTokens = clampInteger(
    parseInteger(
      requestBody.agentMaxTokens ?? storedConfig.agentMaxTokens ?? env.DEEP_RESEARCH_AGENT_MAX_TOKENS,
      DEFAULTS.agentMaxTokens
    ),
    256,
    8192
  );
  const writerMaxTokens = clampInteger(
    parseInteger(
      requestBody.writerMaxTokens ?? storedConfig.writerMaxTokens ?? env.DEEP_RESEARCH_WRITER_MAX_TOKENS,
      DEFAULTS.writerMaxTokens
    ),
    512,
    16384
  );

  const plannerTemperature = clamp(
    parseFloatNumber(
      requestBody.plannerTemperature ?? storedConfig.plannerTemperature ?? env.DEEP_RESEARCH_PLANNER_TEMPERATURE,
      DEFAULTS.plannerTemperature
    ),
    0,
    1
  );
  const agentTemperature = clamp(
    parseFloatNumber(
      requestBody.agentTemperature ?? storedConfig.agentTemperature ?? env.DEEP_RESEARCH_AGENT_TEMPERATURE,
      DEFAULTS.agentTemperature
    ),
    0,
    1
  );
  const writerTemperature = clamp(
    parseFloatNumber(
      requestBody.writerTemperature ?? storedConfig.writerTemperature ?? env.DEEP_RESEARCH_WRITER_TEMPERATURE,
      DEFAULTS.writerTemperature
    ),
    0,
    1
  );

  const requestTimeoutMs = clampInteger(
    parseInteger(
      requestBody.requestTimeoutMs ?? storedConfig.requestTimeoutMs ?? env.DEEP_RESEARCH_TIMEOUT_MS,
      DEFAULTS.requestTimeoutMs
    ),
    5000,
    300000
  );

  const allowWriterModelOverride = parseBoolean(
    requestBody.allowWriterModelOverride ?? storedConfig.allowWriterModelOverride ?? env.DEEP_RESEARCH_ALLOW_WRITER_MODEL_OVERRIDE,
    DEFAULTS.allowWriterModelOverride
  );

  let writerModel = defaultWriterModel;
  if (allowWriterModelOverride && isAllowedWriterModelOverride(requestBody.model)) {
    writerModel = sanitizeAllowedModel(requestBody.model, 'anthropic', defaultWriterModel);
  }

  return {
    enabled,
    plannerModel,
    researcherModel,
    writerModel,
    reportLength,
    reportDepth,
    plannerApiModel: resolveModel('gemini', plannerModel.replace('google/', '')),
    researcherApiModel: resolveModel('gemini', researcherModel.replace('google/', '')),
    writerApiModel: resolveModel('anthropic', writerModel.replace('anthropic/', '')),
    minAgents,
    maxAgents,
    defaultMaxAgents,
    maxParallelAgents,
    plannerMaxTokens,
    agentMaxTokens,
    writerMaxTokens,
    plannerTemperature,
    agentTemperature,
    writerTemperature,
    requestTimeoutMs
  };
};

export default getDeepResearchConfig;
