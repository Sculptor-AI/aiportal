/**
 * Deep research configuration.
 *
 * Centralizes defaults and environment-driven overrides for the
 * planner -> researcher agents -> final writer pipeline.
 */

import { resolveModel } from './index.js';

const DEFAULTS = {
  enabled: true,
  plannerModel: 'gemini-3.1-pro',
  researcherModel: 'gemini-3-flash',
  writerModel: 'claude-sonnet-4.6',
  defaultMaxAgents: 8,
  minAgents: 2,
  maxAgents: 12,
  maxParallelAgents: 4,
  plannerMaxTokens: 2048,
  agentMaxTokens: 3072,
  writerMaxTokens: 8192,
  plannerTemperature: 0.2,
  agentTemperature: 0.2,
  writerTemperature: 0.2,
  // Deep research calls can be long (search-grounded agents + long-form writer output).
  requestTimeoutMs: 180000,
  allowWriterModelOverride: false
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

const isAllowedWriterModelOverride = (model) => {
  if (!model || typeof model !== 'string') return false;
  const normalized = model.trim().toLowerCase();
  return normalized.startsWith('claude') || normalized.startsWith('anthropic/');
};

export const getDeepResearchConfig = (env = {}, requestBody = {}) => {
  const enabled = parseBoolean(env.DEEP_RESEARCH_ENABLED, DEFAULTS.enabled);

  const plannerModel = env.DEEP_RESEARCH_PLANNER_MODEL || DEFAULTS.plannerModel;
  const researcherModel = env.DEEP_RESEARCH_RESEARCHER_MODEL || DEFAULTS.researcherModel;
  const defaultWriterModel = env.DEEP_RESEARCH_WRITER_MODEL || DEFAULTS.writerModel;

  const minAgents = clamp(
    parseInteger(env.DEEP_RESEARCH_MIN_AGENTS, DEFAULTS.minAgents),
    1,
    24
  );
  const maxAgents = clamp(
    parseInteger(env.DEEP_RESEARCH_MAX_AGENTS, DEFAULTS.maxAgents),
    minAgents,
    24
  );
  const defaultMaxAgents = clamp(
    parseInteger(env.DEEP_RESEARCH_DEFAULT_MAX_AGENTS, DEFAULTS.defaultMaxAgents),
    minAgents,
    maxAgents
  );

  const maxParallelAgents = clamp(
    parseInteger(env.DEEP_RESEARCH_MAX_PARALLEL_AGENTS, DEFAULTS.maxParallelAgents),
    1,
    maxAgents
  );

  const plannerMaxTokens = clamp(
    parseInteger(env.DEEP_RESEARCH_PLANNER_MAX_TOKENS, DEFAULTS.plannerMaxTokens),
    256,
    8192
  );
  const agentMaxTokens = clamp(
    parseInteger(env.DEEP_RESEARCH_AGENT_MAX_TOKENS, DEFAULTS.agentMaxTokens),
    256,
    8192
  );
  const writerMaxTokens = clamp(
    parseInteger(env.DEEP_RESEARCH_WRITER_MAX_TOKENS, DEFAULTS.writerMaxTokens),
    512,
    16384
  );

  const plannerTemperature = clamp(
    parseFloatNumber(env.DEEP_RESEARCH_PLANNER_TEMPERATURE, DEFAULTS.plannerTemperature),
    0,
    1
  );
  const agentTemperature = clamp(
    parseFloatNumber(env.DEEP_RESEARCH_AGENT_TEMPERATURE, DEFAULTS.agentTemperature),
    0,
    1
  );
  const writerTemperature = clamp(
    parseFloatNumber(env.DEEP_RESEARCH_WRITER_TEMPERATURE, DEFAULTS.writerTemperature),
    0,
    1
  );

  const requestTimeoutMs = clamp(
    parseInteger(env.DEEP_RESEARCH_TIMEOUT_MS, DEFAULTS.requestTimeoutMs),
    5000,
    300000
  );

  const allowWriterModelOverride = parseBoolean(
    env.DEEP_RESEARCH_ALLOW_WRITER_MODEL_OVERRIDE,
    DEFAULTS.allowWriterModelOverride
  );

  let writerModel = defaultWriterModel;
  if (allowWriterModelOverride && isAllowedWriterModelOverride(requestBody.model)) {
    writerModel = requestBody.model.trim();
  }

  return {
    enabled,
    plannerModel,
    researcherModel,
    writerModel,
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
