const USAGE_LIMITS_KEY = 'settings:usage-limits';

export const TIER_NAMES = Object.freeze(['pro', 'lite', 'image', 'video']);
export const TIER_LABELS = Object.freeze({
  pro: 'Pro',
  lite: 'Lite',
  image: 'Image',
  video: 'Video'
});

const DEFAULT_TIER_LIMIT = Object.freeze({ limit: null, windowSeconds: null });
const DEFAULT_TIER_LIMITS = Object.freeze({
  pro: { ...DEFAULT_TIER_LIMIT },
  lite: { ...DEFAULT_TIER_LIMIT },
  image: { ...DEFAULT_TIER_LIMIT },
  video: { ...DEFAULT_TIER_LIMIT }
});

export const DEFAULT_USAGE_LIMITS = Object.freeze({
  turns: null,
  images: null,
  videos: null,
  tiers: { ...DEFAULT_TIER_LIMITS },
  modelTiers: {}
});

export const DEFAULT_USER_USAGE = Object.freeze({
  turns: 0,
  images: 0,
  videos: 0,
  resetAt: null,
  updatedAt: null
});

const USAGE_FIELDS = ['turns', 'images', 'videos'];
const TIER_MAX_WINDOW_SECONDS = 60 * 60 * 24 * 31;

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

const normalizeTierName = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim().toLowerCase();
  return TIER_NAMES.includes(trimmed) ? trimmed : null;
};

const normalizeModelId = (value) => {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim().slice(0, 200);
};

const normalizeTierLimit = (rawTier) => {
  const limit = normalizePositiveInteger(rawTier?.limit);
  const windowSeconds = normalizePositiveInteger(rawTier?.windowSeconds);

  if (limit === null || windowSeconds === null || windowSeconds > TIER_MAX_WINDOW_SECONDS) {
    return { ...DEFAULT_TIER_LIMIT };
  }

  return { limit, windowSeconds };
};

const normalizeTierLimits = (rawTiers = {}) => {
  const out = {};
  for (const tier of TIER_NAMES) {
    out[tier] = normalizeTierLimit(rawTiers?.[tier]);
  }
  return out;
};

const parseTierLimitsInput = (rawTiers) => {
  if (rawTiers === null || rawTiers === undefined) {
    return undefined;
  }
  if (typeof rawTiers !== 'object') {
    throw new Error('tiers must be an object keyed by tier name.');
  }

  const parsed = {};
  for (const tier of TIER_NAMES) {
    const raw = rawTiers[tier];
    if (raw === undefined) {
      parsed[tier] = { ...DEFAULT_TIER_LIMIT };
      continue;
    }

    if (raw === null) {
      parsed[tier] = { ...DEFAULT_TIER_LIMIT };
      continue;
    }

    const blank =
      raw.limit === '' || raw.limit === null || raw.limit === undefined ||
      raw.windowSeconds === '' || raw.windowSeconds === null || raw.windowSeconds === undefined;

    if (blank) {
      parsed[tier] = { ...DEFAULT_TIER_LIMIT };
      continue;
    }

    const limit = normalizePositiveInteger(raw.limit);
    if (limit === null) {
      throw new Error(`Limit for the ${TIER_LABELS[tier]} tier must be a positive whole number.`);
    }

    const windowSeconds = normalizePositiveInteger(raw.windowSeconds);
    if (windowSeconds === null || windowSeconds > TIER_MAX_WINDOW_SECONDS) {
      throw new Error(`Window for the ${TIER_LABELS[tier]} tier must be between 1 second and 31 days.`);
    }

    parsed[tier] = { limit, windowSeconds };
  }

  return parsed;
};

const normalizeModelTiers = (rawMap = {}) => {
  if (!rawMap || typeof rawMap !== 'object') {
    return {};
  }

  const out = {};
  for (const [rawModelId, rawTier] of Object.entries(rawMap)) {
    const modelId = normalizeModelId(rawModelId);
    const tier = normalizeTierName(rawTier);
    if (!modelId || !tier) continue;
    out[modelId] = tier;
  }
  return out;
};

const parseModelTiersInput = (rawMap) => {
  if (rawMap === null || rawMap === undefined) {
    return undefined;
  }
  if (typeof rawMap !== 'object') {
    throw new Error('modelTiers must be an object keyed by model id.');
  }

  const out = {};
  for (const [rawModelId, rawTier] of Object.entries(rawMap)) {
    const modelId = normalizeModelId(rawModelId);
    if (!modelId) continue;

    if (rawTier === '' || rawTier === null || rawTier === undefined) {
      continue;
    }

    const tier = normalizeTierName(rawTier);
    if (!tier) {
      throw new Error(`Unknown tier "${rawTier}" assigned to ${modelId}. Valid tiers: ${TIER_NAMES.join(', ')}.`);
    }
    out[modelId] = tier;
  }
  return out;
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
  tiers: normalizeTierLimits(rawLimits.tiers),
  modelTiers: normalizeModelTiers(rawLimits.modelTiers)
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

  if ('tiers' in rawLimits) {
    const parsedTiers = parseTierLimitsInput(rawLimits.tiers);
    if (parsedTiers !== undefined) {
      parsedLimits.tiers = parsedTiers;
    }
  }

  if ('modelTiers' in rawLimits) {
    const parsedTiers = parseModelTiersInput(rawLimits.modelTiers);
    if (parsedTiers !== undefined) {
      parsedLimits.modelTiers = parsedTiers;
    }
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
    return { ...DEFAULT_USAGE_LIMITS, tiers: { ...DEFAULT_TIER_LIMITS }, modelTiers: {} };
  }

  try {
    const storedLimits = await kv.get(USAGE_LIMITS_KEY, 'json');
    return normalizeUsageLimits(storedLimits || {});
  } catch (error) {
    console.error('Error reading usage limits:', error);
    return { ...DEFAULT_USAGE_LIMITS, tiers: { ...DEFAULT_TIER_LIMITS }, modelTiers: {} };
  }
};

export const updateGlobalUsageLimits = async (kv, rawLimits = {}) => {
  if (!kv) {
    throw new Error('Storage not configured');
  }

  const currentLimits = await getGlobalUsageLimits(kv);
  const parsed = parseUsageLimitsInput(rawLimits);
  const nextLimits = {
    ...currentLimits,
    ...parsed,
    tiers: parsed.tiers ?? currentLimits.tiers,
    modelTiers: parsed.modelTiers ?? currentLimits.modelTiers
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

const resolveTierForModel = (limits, modelId, kind) => {
  const normalizedModelId = normalizeModelId(modelId);
  const fromMap = limits?.modelTiers?.[normalizedModelId];
  if (fromMap && TIER_NAMES.includes(fromMap)) {
    return fromMap;
  }
  if (kind === 'image' || kind === 'video') {
    return kind;
  }
  return null;
};

const tierStateKey = (tier, userId) => `ratelimit:tier:${tier}:user:${userId}`;

export const evaluateTierRateLimit = async ({ kv, userId, modelId, kind, limits }) => {
  const tier = resolveTierForModel(limits, modelId, kind);
  const tierConfig = tier ? limits?.tiers?.[tier] : null;
  const hasLimit = tierConfig && tierConfig.limit && tierConfig.windowSeconds;

  if (!kv || !userId || !tier || !hasLimit) {
    return {
      allowed: true,
      tier,
      modelId: normalizeModelId(modelId),
      rule: null
    };
  }

  const now = Date.now();
  const key = tierStateKey(tier, userId);
  const windowMs = tierConfig.windowSeconds * 1000;
  let state = await kv.get(key, 'json');

  if (
    !state ||
    typeof state.resetAt !== 'number' ||
    state.resetAt <= now ||
    state.windowSeconds !== tierConfig.windowSeconds
  ) {
    state = {
      count: 0,
      resetAt: now + windowMs,
      windowSeconds: tierConfig.windowSeconds
    };
  }

  state.count += 1;

  const ttlSeconds = Math.max(1, Math.ceil((state.resetAt - now) / 1000));
  await kv.put(key, JSON.stringify(state), { expirationTtl: ttlSeconds });

  const rule = {
    tier,
    label: TIER_LABELS[tier],
    limit: tierConfig.limit,
    windowSeconds: tierConfig.windowSeconds,
    used: state.count,
    remaining: Math.max(0, tierConfig.limit - state.count),
    resetAt: new Date(state.resetAt).toISOString(),
    retryAfterSeconds: ttlSeconds,
    exceeded: state.count > tierConfig.limit
  };

  if (rule.exceeded) {
    return {
      allowed: false,
      tier,
      modelId: normalizeModelId(modelId),
      rule,
      message: `This account has reached the rate limit for the ${TIER_LABELS[tier]} tier. Try again after ${rule.resetAt}.`
    };
  }

  return {
    allowed: true,
    tier,
    modelId: normalizeModelId(modelId),
    rule
  };
};

export const peekUserTierRateLimits = async ({ kv, userId, limits }) => {
  const normalizedLimits = normalizeUsageLimits(limits || {});
  const buckets = [];

  for (const tier of TIER_NAMES) {
    const config = normalizedLimits.tiers?.[tier] || { ...DEFAULT_TIER_LIMIT };
    let used = 0;
    let resetAt = null;
    let windowSeconds = config.windowSeconds || null;

    if (kv && userId && config.limit && config.windowSeconds) {
      const state = await kv.get(tierStateKey(tier, userId), 'json');
      const now = Date.now();
      if (
        state &&
        typeof state.resetAt === 'number' &&
        state.resetAt > now &&
        state.windowSeconds === config.windowSeconds
      ) {
        used = normalizeCount(state.count);
        resetAt = new Date(state.resetAt).toISOString();
      } else {
        used = 0;
        resetAt = null;
      }
    }

    buckets.push({
      tier,
      label: TIER_LABELS[tier],
      limit: config.limit ?? null,
      windowSeconds,
      used,
      remaining: config.limit ? Math.max(0, config.limit - used) : null,
      resetAt,
      configured: !!(config.limit && config.windowSeconds)
    });
  }

  return { buckets };
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
