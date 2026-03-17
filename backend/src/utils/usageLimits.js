const USAGE_LIMITS_KEY = 'settings:usage-limits';

export const DEFAULT_USAGE_LIMITS = Object.freeze({
  turns: null,
  images: null,
  videos: null
});

export const DEFAULT_USER_USAGE = Object.freeze({
  turns: 0,
  images: 0,
  videos: 0,
  resetAt: null,
  updatedAt: null
});

const USAGE_FIELDS = ['turns', 'images', 'videos'];

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
  videos: normalizeLimitValue(rawLimits.videos)
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
