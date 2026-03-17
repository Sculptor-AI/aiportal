/**
 * Simple KV-backed fixed-window rate limiter middleware.
 */

const getClientIp = (c) => {
  const cfIp = c.req.header('CF-Connecting-IP');
  if (cfIp) return cfIp.trim();

  const xForwardedFor = c.req.header('X-Forwarded-For');
  if (xForwardedFor) {
    const first = xForwardedFor.split(',')[0]?.trim();
    if (first) return first;
  }

  return 'unknown';
};

export const createRateLimiter = ({ keyPrefix, limit, windowSeconds }) => {
  const windowMs = windowSeconds * 1000;

  return async (c, next) => {
    const kv = c.env?.KV;
    if (!kv) {
      await next();
      return;
    }

    const clientIp = getClientIp(c);
    const user = c.get('user');
    const identity = user?.id ? `user:${user.id}` : `ip:${clientIp}`;
    const key = `ratelimit:${keyPrefix}:${identity}`;
    const now = Date.now();

    let state = await kv.get(key, 'json');
    if (!state || typeof state.resetAt !== 'number' || state.resetAt <= now) {
      state = { count: 0, resetAt: now + windowMs };
    }

    state.count += 1;

    const ttlSeconds = Math.max(1, Math.ceil((state.resetAt - now) / 1000));
    await kv.put(key, JSON.stringify(state), { expirationTtl: ttlSeconds });

    if (state.count > limit) {
      c.header('Retry-After', String(ttlSeconds));
      return c.json({
        error: 'Too many requests. Please try again later.'
      }, 429);
    }

    await next();
  };
};

export const authLoginRateLimit = createRateLimiter({
  keyPrefix: 'auth-login',
  limit: 8,
  windowSeconds: 900 // 15 minutes
});

export const authRegisterRateLimit = createRateLimiter({
  keyPrefix: 'auth-register',
  limit: 6,
  windowSeconds: 3600 // 1 hour
});

export const adminLoginRateLimit = createRateLimiter({
  keyPrefix: 'admin-login',
  limit: 5,
  windowSeconds: 900 // 15 minutes
});

export const chatGenerationRateLimit = createRateLimiter({
  keyPrefix: 'chat-generate',
  limit: 120,
  windowSeconds: 300 // 5 minutes
});

export const imageGenerationRateLimit = createRateLimiter({
  keyPrefix: 'image-generate',
  limit: 30,
  windowSeconds: 300 // 5 minutes
});

export const videoGenerationRateLimit = createRateLimiter({
  keyPrefix: 'video-generate',
  limit: 12,
  windowSeconds: 600 // 10 minutes
});

export const deepResearchRateLimit = createRateLimiter({
  keyPrefix: 'deep-research',
  limit: 20,
  windowSeconds: 1800 // 30 minutes
});
