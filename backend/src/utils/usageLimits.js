const USAGE_LIMITS_KEY = 'settings:usage-limits';

export const DEFAULT_USAGE_LIMITS = Object.freeze({
  turns: null,
  images: null,
  videos: null,
  modelRateLimits: []
});

export const DEFAULT_USER_USAGE = Object.freeze({
  turns: 0,
  images: 0,
  videos: 0,
  resetAt: null,
  updatedAt: null
});

const USAGE_FIELDS = ['turns', 'images', 'videos'];
const MODEL_RATE_LIMIT_MAX_WINDOW_SECONDS = 60 * 60 * 24 * 31;

const normalizeCount = (value) => {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue < 0) {
    return 0;
  }

  return Math.floor(numericValue);
};

const normalizeLimitValue = (value) => {
  if (value === '' || value === null || value === undefined) {
    return null;
  }

  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue < 0) {
    return null;
  }

  return Math.floor(numericValue);
};

const normalizePositiveInteger = (value) => {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue <= 0 || !Number.isInteger(numericValue)) {
    return null;
  }

  return numericValue;
};

const normalizeModelId = (value) => {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim().slice(0, 200);
};

const normalizeRuleId = (value) => {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim().replace(/[^a-zA-Z0-9:_-]/g, '-').slice(0, 120);
};

const createModelRateLimitId = (modelId, limit, windowSeconds, index) => {
  const safeModelId = modelId.replace(/[^a-zA-Z0-9:_-]/g, '-').slice(0, 80) || 'model';
  return `${safeModelId}:${limit}:${windowSeconds}:${index}`;
};

const normalizeModelRateLimitRule = (rawRule, index = 0, { strict = false } = {}) => {
  const modelId = normalizeModelId(rawRule?.modelId ?? rawRule?.model);
  const limit = normalizePositiveInteger(rawRule?.limit);
  const windowSeconds = normalizePositiveInteger(rawRule?.windowSeconds);

  if (!modelId) {
    if (strict) throw new Error('Model rate limit rules need a model.');
    return null;
  }

  if (limit === null) {
    if (strict) throw new Error(`Rate limit for ${modelId} must be a positive whole number.`);
    return null;
  }

  if (windowSeconds === null || windowSeconds > MODEL_RATE_LIMIT_MAX_WINDOW_SECONDS) {
    if (strict) throw new Error(`Rate limit window for ${modelId} must be between 1 second and 31 days.`);
    return null;
  }

  const id = normalizeRuleId(rawRule?.id) || createModelRateLimitId(modelId, limit, windowSeconds, index);

  return {
    id,
    modelId,
    limit,
    windowSeconds
  };
};

export const normalizeModelRateLimits = (rawRules = []) => {
  const sourceRules = Array.isArray(rawRules)
    ? rawRules
    : Object.entries(rawRules || {}).map(([modelId, rule]) => ({
      ...(typeof rule === 'object' && rule !== null ? rule : {}),
      modelId
    }));
  const seenIds = new Set();
  const normalizedRules = [];

  sourceRules.forEach((rule, index) => {
    const normalizedRule = normalizeModelRateLimitRule(rule, index);
    if (!normalizedRule || seenIds.has(normalizedRule.id)) {
      return;
    }

    seenIds.add(normalizedRule.id);
    normalizedRules.push(normalizedRule);
  });

  return normalizedRules;
};

const normalizeTimestamp = (value) => {
  if (!value || typeof value !== 'string') {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
};

export const normalizeUsageLimits = (rawLimits = {}) => ({
  turns: normalizeLimitValue(rawLimits.turns),
  images: normalizeLimitValue(rawLimits.images),
  videos: normalizeLimitValue(rawLimits.videos),
  modelRateLimits: normalizeModelRateLimits(rawLimits.modelRateLimits)
});

export const parseUsageLimitsInput = (rawLimits = {}) => {
  const parsedLimits = {};

  for (const field of USAGE_FIELDS) {
    if (!(field in rawLimits)) {
      continue;
    }

    const value = rawLimits[field];
    if (value === '' || value === null || value === undefined) {
      parsedLimits[field] = null;
      continue;
    }

    const numericValue = Number(value);
    if (!Number.isFinite(numericValue) || numericValue < 0 || !Number.isInteger(numericValue)) {
      throw new Error(`${field} limit must be a whole number or blank.`);
    }

    parsedLimits[field] = numericValue;
  }

  if ('modelRateLimits' in rawLimits) {
    const sourceRules = Array.isArray(rawLimits.modelRateLimits)
      ? rawLimits.modelRateLimits
      : Object.entries(rawLimits.modelRateLimits || {}).map(([modelId, rule]) => ({
        ...(typeof rule === 'object' && rule !== null ? rule : {}),
        modelId
      }));
    const seenIds = new Set();

    parsedLimits.modelRateLimits = sourceRules.map((rule, index) => {
      const normalizedRule = normalizeModelRateLimitRule(rule, index, { strict: true });
      if (seenIds.has(normalizedRule.id)) {
        throw new Error(`Duplicate model rate limit rule id: ${normalizedRule.id}`);
      }
      seenIds.add(normalizedRule.id);
      return normalizedRule;
    });
  }

  return parsedLimits;
};

export const getUserUsage = (user) => {
  const usage = user?.usage || {};

  return {
    turns: normalizeCount(usage.turns),
    images: normalizeCount(usage.images),
    videos: normalizeCount(usage.videos),
    resetAt: normalizeTimestamp(usage.resetAt),
    updatedAt: normalizeTimestamp(usage.updatedAt)
  };
};

export const withNormalizedUserUsage = (user) => {
  if (!user) {
    return null;
  }

  return {
    ...user,
    usage: getUserUsage(user)
  };
};

export const summarizeUsageTotals = (users = []) => {
  return users.reduce((totals, user) => {
    const usage = getUserUsage(user);

    totals.totalTurnsUsed += usage.turns;
    totals.totalImagesUsed += usage.images;
    totals.totalVideosUsed += usage.videos;
    return totals;
  }, {
    totalTurnsUsed: 0,
    totalImagesUsed: 0,
    totalVideosUsed: 0
  });
};

export const getGlobalUsageLimits = async (kv) => {
  if (!kv) {
    return { ...DEFAULT_USAGE_LIMITS };
  }

  try {
    const storedLimits = await kv.get(USAGE_LIMITS_KEY, 'json');
    return {
      ...DEFAULT_USAGE_LIMITS,
      ...normalizeUsageLimits(storedLimits || {})
    };
  } catch (error) {
    console.error('Error reading usage limits:', error);
    return { ...DEFAULT_USAGE_LIMITS };
  }
};

export const updateGlobalUsageLimits = async (kv, rawLimits = {}) => {
  if (!kv) {
    throw new Error('Storage not configured');
  }

  const currentLimits = await getGlobalUsageLimits(kv);
  const nextLimits = {
    ...currentLimits,
    ...parseUsageLimitsInput(rawLimits)
  };

  await kv.put(USAGE_LIMITS_KEY, JSON.stringify(nextLimits));
  return nextLimits;
};

export const evaluateUsageRequest = ({ user, limits, requested = {} }) => {
  const usage = getUserUsage(user);
  const normalizedLimits = {
    ...DEFAULT_USAGE_LIMITS,
    ...normalizeUsageLimits(limits || {})
  };
  const normalizedRequested = {
    turns: normalizeCount(requested.turns),
    images: normalizeCount(requested.images),
    videos: normalizeCount(requested.videos)
  };

  for (const field of USAGE_FIELDS) {
    const limit = normalizedLimits[field];
    const amountRequested = normalizedRequested[field];

    if (limit === null || amountRequested <= 0) {
      continue;
    }

    if ((usage[field] + amountRequested) > limit) {
      const resourceLabel = field === 'turns'
        ? 'turns'
        : field === 'images'
          ? 'image generations'
          : 'video generations';

      return {
        allowed: false,
        field,
        usage,
        limits: normalizedLimits,
        requested: normalizedRequested,
        message: `This account has reached its ${resourceLabel} limit.`
      };
    }
  }

  return {
    allowed: true,
    usage,
    limits: normalizedLimits,
    requested: normalizedRequested
  };
};

const getMatchingModelRateLimitRules = (limits, modelId) => {
  const normalizedModelId = normalizeModelId(modelId);
  if (!normalizedModelId) {
    return [];
  }

  return normalizeModelRateLimits(limits?.modelRateLimits).filter((rule) => rule.modelId === normalizedModelId);
};

export const evaluateModelRateLimits = async ({ kv, userId, modelId, limits }) => {
  const rules = getMatchingModelRateLimitRules(limits, modelId);
  if (!kv || !userId || rules.length === 0) {
    return {
      allowed: true,
      modelId: normalizeModelId(modelId),
      rules: []
    };
  }

  const now = Date.now();
  const evaluatedRules = [];

  for (const rule of rules) {
    const key = `ratelimit:model:${rule.id}:user:${userId}`;
    const windowMs = rule.windowSeconds * 1000;
    let state = await kv.get(key, 'json');

    if (!state || typeof state.resetAt !== 'number' || state.resetAt <= now || state.windowSeconds !== rule.windowSeconds) {
      state = {
        count: 0,
        resetAt: now + windowMs,
        windowSeconds: rule.windowSeconds
      };
    }

    state.count += 1;

    const ttlSeconds = Math.max(1, Math.ceil((state.resetAt - now) / 1000));
    await kv.put(key, JSON.stringify(state), { expirationTtl: ttlSeconds });

    evaluatedRules.push({
      ...rule,
      used: state.count,
      remaining: Math.max(0, rule.limit - state.count),
      resetAt: new Date(state.resetAt).toISOString(),
      retryAfterSeconds: ttlSeconds,
      exceeded: state.count > rule.limit
    });
  }

  const exceededRules = evaluatedRules.filter((rule) => rule.exceeded);
  if (exceededRules.length > 0) {
    exceededRules.sort((a, b) => b.retryAfterSeconds - a.retryAfterSeconds);
    const blockingRule = exceededRules[0];

    return {
      allowed: false,
      modelId: normalizeModelId(modelId),
      blockingRule,
      rules: evaluatedRules,
      message: `This account has reached the rate limit for ${blockingRule.modelId}. Try again after ${blockingRule.resetAt}.`
    };
  }

  return {
    allowed: true,
    modelId: normalizeModelId(modelId),
    rules: evaluatedRules
  };
};

const persistUserUsage = async (kv, userId, transformUsage) => {
  if (!kv || !userId) {
    throw new Error('Storage not configured');
  }

  const userKey = `user:${userId}`;
  const user = await kv.get(userKey, 'json');

  if (!user) {
    throw new Error('User not found');
  }

  const currentUsage = getUserUsage(user);
  const timestamp = new Date().toISOString();
  const nextUsage = transformUsage(currentUsage, timestamp);

  user.usage = {
    ...DEFAULT_USER_USAGE,
    ...nextUsage,
    resetAt: normalizeTimestamp(nextUsage.resetAt),
    updatedAt: normalizeTimestamp(nextUsage.updatedAt)
  };
  user.updated_at = timestamp;

  await kv.put(userKey, JSON.stringify(user));
  return user.usage;
};

export const incrementUserUsage = async (kv, userId, increments = {}) => {
  const requested = {
    turns: normalizeCount(increments.turns),
    images: normalizeCount(increments.images),
    videos: normalizeCount(increments.videos)
  };

  const hasChanges = Object.values(requested).some((value) => value > 0);
  if (!hasChanges) {
    return null;
  }

  return persistUserUsage(kv, userId, (currentUsage, timestamp) => ({
    turns: currentUsage.turns + requested.turns,
    images: currentUsage.images + requested.images,
    videos: currentUsage.videos + requested.videos,
    resetAt: currentUsage.resetAt,
    updatedAt: timestamp
  }));
};

export const resetUserUsage = async (kv, userId) => {
  return persistUserUsage(kv, userId, (_currentUsage, timestamp) => ({
    ...DEFAULT_USER_USAGE,
    resetAt: timestamp,
    updatedAt: timestamp
  }));
};
