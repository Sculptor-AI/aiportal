/**
 * Authentication Routes
 * Handles user registration, login, and API key management
 */

import { Hono } from 'hono';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import { hashPassword, verifyPassword, generateSessionToken, generateApiKey, hashToken, getTokenPrefix } from '../utils/crypto.js';
import { requireAuth } from '../middleware/auth.js';
import { parseAllowedOrigins } from '../middleware/cors.js';
import { authLoginRateLimit, authRegisterRateLimit } from '../middleware/rateLimit.js';
import { addUserSessionIndex, findUserByEmail, findUserByOAuthAccount, removeUserSessionIndex } from '../utils/helpers.js';
import { createPkceChallenge, createSignedToken, generatePkceVerifier, generateRandomToken, getOAuthProviderConfig, isSupportedOAuthProvider, verifySignedToken } from '../utils/oauth.js';

const auth = new Hono();
const MAX_PASSWORD_LENGTH = 128;
const OAUTH_STATE_COOKIE_PREFIX = 'oauth_state_';
const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;
const OAUTH_COMPLETION_TTL_MS = 5 * 60 * 1000;
const DEFAULT_USER_SETTINGS = { theme: 'light' };

const isPasswordComplexEnough = (password) => {
  if (typeof password !== 'string') return false;
  return (
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
};

/**
 * Helper: Get current ISO timestamp
 */
const nowIso = () => new Date().toISOString();

/**
 * Helper: Sanitize user object (remove sensitive data)
 */
const sanitizeUser = (user) => {
  if (!user) return null;
  const { passwordHash, passwordSalt, ...safeUser } = user;
  return safeUser;
};

/**
 * Helper: Check if username exists
 */
const usernameExists = async (kv, username) => {
  const key = `username:${username.toLowerCase()}`;
  const userId = await kv.get(key);
  return !!userId;
};

/**
 * Helper: Check if email exists
 */
const emailExists = async (kv, email) => {
  const key = `email:${email.toLowerCase()}`;
  const userId = await kv.get(key);
  return !!userId;
};

/**
 * Helper: Get user by username
 */
const getUserByUsername = async (kv, username) => {
  const key = `username:${username.toLowerCase()}`;
  const userId = await kv.get(key);
  if (!userId) return null;
  return await kv.get(`user:${userId}`, 'json');
};

const getOAuthSecret = (env) => {
  return env?.OAUTH_STATE_SECRET || env?.AUTH_STATE_SECRET || null;
};

const getCookieOptions = (requestUrl, path) => ({
  httpOnly: true,
  secure: requestUrl.protocol === 'https:',
  sameSite: 'Lax',
  path,
  maxAge: Math.floor(OAUTH_STATE_TTL_MS / 1000)
});

const getDeleteCookieOptions = (requestUrl, path) => ({
  httpOnly: true,
  secure: requestUrl.protocol === 'https:',
  sameSite: 'Lax',
  path
});

const normalizeAppOrigin = (rawOrigin, allowedOrigins, fallbackOrigin) => {
  if (!rawOrigin || typeof rawOrigin !== 'string') {
    return fallbackOrigin;
  }

  try {
    const parsed = new URL(rawOrigin);
    return allowedOrigins.includes(parsed.origin) ? parsed.origin : fallbackOrigin;
  } catch (error) {
    return fallbackOrigin;
  }
};

const normalizeReturnTo = (rawValue) => {
  if (typeof rawValue !== 'string') {
    return '/';
  }

  if (!rawValue.startsWith('/') || rawValue.startsWith('//')) {
    return '/';
  }

  return rawValue;
};

const buildCompletionRedirectUrl = (appOrigin, completionToken) => {
  const origin = appOrigin.replace(/\/+$/, '');
  return `${origin}/auth/callback#oauth_result=${encodeURIComponent(completionToken)}`;
};

const buildCompletionToken = async (env, payload) => {
  const oauthSecret = getOAuthSecret(env);
  if (!oauthSecret) {
    throw new Error('OAuth secret not configured');
  }

  return createSignedToken(oauthSecret, {
    ...payload,
    exp: Date.now() + OAUTH_COMPLETION_TTL_MS
  });
};

const updateLinkedProvider = (user, provider, providerUserId, overrides = {}) => {
  const authProviders = Array.isArray(user.authProviders) ? [...user.authProviders] : [];
  const existingIndex = authProviders.findIndex((entry) => entry?.provider === provider);
  const now = nowIso();
  const nextEntry = {
    provider,
    providerUserId,
    linkedAt: now,
    ...overrides
  };

  if (existingIndex >= 0) {
    authProviders[existingIndex] = {
      ...authProviders[existingIndex],
      ...nextEntry,
      linkedAt: authProviders[existingIndex].linkedAt || nextEntry.linkedAt
    };
  } else {
    authProviders.push(nextEntry);
  }

  user.authProviders = authProviders;
  return user;
};

const sanitizeUsernameCandidate = (value) => {
  const normalized = String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '_')
    .replace(/^[_-]+|[_-]+$/g, '');

  let candidate = normalized || 'user';

  if (!/^[a-z0-9]/.test(candidate)) {
    candidate = `u${candidate}`;
  }

  if (!/[a-z0-9]$/.test(candidate)) {
    candidate = `${candidate}u`;
  }

  candidate = candidate.slice(0, 30).replace(/[_-]+$/g, '');

  while (candidate.length < 3) {
    candidate += 'x';
  }

  return candidate;
};

const generateOAuthUsername = async (kv, profile) => {
  const localPart = typeof profile?.email === 'string'
    ? profile.email.split('@')[0]
    : '';
  const candidates = [
    profile?.name,
    profile?.given_name,
    localPart,
    `${profile?.provider || 'user'}_${generateRandomToken(4).toLowerCase()}`
  ]
    .filter(Boolean)
    .map((candidate) => sanitizeUsernameCandidate(candidate));

  for (const baseCandidate of candidates) {
    const trimmedBase = baseCandidate.slice(0, 30);
    if (!(await usernameExists(kv, trimmedBase))) {
      return trimmedBase;
    }

    for (let suffix = 2; suffix <= 50; suffix += 1) {
      const suffixValue = String(suffix);
      const candidate = `${trimmedBase.slice(0, 30 - suffixValue.length)}${suffixValue}`;
      if (!(await usernameExists(kv, candidate))) {
        return candidate;
      }
    }
  }

  return `user${generateRandomToken(6).toLowerCase().slice(0, 6)}`;
};

const createSessionForUser = async (kv, user, provider = null) => {
  const accessToken = generateSessionToken();
  const tokenHash = await hashToken(accessToken);
  const createdAt = nowIso();

  await kv.put(`session:${tokenHash}`, JSON.stringify({
    userId: user.id,
    createdAt,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  }), {
    expirationTtl: 86400
  });

  await addUserSessionIndex(kv, user.id, tokenHash);

  user.last_login = createdAt;
  user.updated_at = createdAt;

  if (provider && Array.isArray(user.authProviders)) {
    user.authProviders = user.authProviders.map((entry) => (
      entry?.provider === provider
        ? { ...entry, lastLoginAt: createdAt }
        : entry
    ));
  }

  await kv.put(`user:${user.id}`, JSON.stringify(user));

  return {
    user: sanitizeUser(user),
    accessToken,
    refreshToken: null
  };
};

const createOAuthUser = async (kv, provider, profile) => {
  const id = crypto.randomUUID();
  const now = nowIso();
  const email = profile.email.toLowerCase();
  const username = await generateOAuthUsername(kv, { ...profile, provider });
  const user = {
    id,
    username,
    email,
    status: 'pending',
    role: 'user',
    created_at: now,
    updated_at: now,
    last_login: null,
    settings: { ...DEFAULT_USER_SETTINGS },
    authProviders: [{
      provider,
      providerUserId: profile.sub,
      email,
      emailVerified: !!profile.email_verified,
      picture: profile.picture || null,
      linkedAt: now,
      lastLoginAt: null
    }],
    profile: {
      name: profile.name || null,
      givenName: profile.given_name || null,
      familyName: profile.family_name || null,
      picture: profile.picture || null
    }
  };

  try {
    await kv.put(`user:${id}`, JSON.stringify(user));
    await kv.put(`username:${username.toLowerCase()}`, id);
    await kv.put(`email:${email}`, id);
    await kv.put(`oauth:${provider}:${profile.sub}`, id);
    return user;
  } catch (error) {
    try {
      await Promise.all([
        kv.delete(`user:${id}`),
        kv.delete(`username:${username.toLowerCase()}`),
        kv.delete(`email:${email}`),
        kv.delete(`oauth:${provider}:${profile.sub}`)
      ]);
    } catch (_) {
      // Best effort rollback.
    }

    throw error;
  }
};

const resolveGoogleUser = async (kv, profile) => {
  const linkedUser = await findUserByOAuthAccount(kv, 'google', profile.sub);
  if (linkedUser) {
    return { user: linkedUser, created: false };
  }

  const emailUser = await findUserByEmail(kv, profile.email);
  if (emailUser) {
    const matchingProvider = Array.isArray(emailUser.authProviders)
      ? emailUser.authProviders.find((entry) => entry?.provider === 'google' && entry?.providerUserId === profile.sub)
      : null;

    if (matchingProvider) {
      await kv.put(`oauth:google:${profile.sub}`, emailUser.id);
      return { user: emailUser, created: false };
    }

    return {
      user: null,
      created: false,
      error: 'An account with this email already exists. Please sign in with your username and password, then contact an administrator to link Google sign-in.'
    };
  }

  const createdUser = await createOAuthUser(kv, 'google', profile);
  return { user: createdUser, created: true };
};

/**
 * User registration
 * POST /api/auth/register
 */
auth.post('/register', authRegisterRateLimit, async (c) => {
  const kv = c.env.KV;
  if (!kv) {
    return c.json({ error: 'Storage not configured' }, 500);
  }

  const body = await c.req.json().catch(() => ({}));
  const { username, password, email } = body;

  // Validate input
  if (!username || !password || !email) {
    return c.json({ error: 'Username, password, and email are required' }, 400);
  }

  if (username.length < 3 || username.length > 30) {
    return c.json({ error: 'Username must be between 3 and 30 characters' }, 400);
  }

  // Username must start and end with alphanumeric, can contain underscores/hyphens in middle
  // Requires 2+ chars (but length check above enforces 3+ minimum)
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]*[a-zA-Z0-9]$/.test(username)) {
    return c.json({ error: 'Username must start and end with a letter or number, and can only contain letters, numbers, underscores, and hyphens' }, 400);
  }

  if (password.length < 12) {
    return c.json({ error: 'Password must be at least 12 characters long' }, 400);
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    return c.json({ error: `Password must be at most ${MAX_PASSWORD_LENGTH} characters long` }, 400);
  }
  if (!isPasswordComplexEnough(password)) {
    return c.json({
      error: 'Password must include at least one uppercase letter, one lowercase letter, one number, and one special character'
    }, 400);
  }

  // Email validation with minimum 2-character TLD
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return c.json({ error: 'Invalid email address' }, 400);
  }

  // Check for existing username/email
  if (await usernameExists(kv, username) || await emailExists(kv, email)) {
    return c.json({ error: 'Registration failed. Account may already exist.' }, 409);
  }

  // Hash the password
  const { hash, salt } = await hashPassword(password);

  // Create user
  // Note: Username preserves original casing for display, email is normalized to lowercase
  // Index keys are always lowercase for case-insensitive lookups
  const id = crypto.randomUUID();
  const now = nowIso();
  const user = {
    id,
    username,                    // Preserves original casing (e.g., "JohnDoe")
    email: email.toLowerCase(),  // Normalized to lowercase
    passwordHash: hash,
    passwordSalt: salt,
    status: 'pending', // New users require approval
    role: 'user',
    created_at: now,
    updated_at: now,
    last_login: null,
    settings: { theme: 'light' }
  };

  // Store user and indexes with rollback on failure
  try {
    await kv.put(`user:${id}`, JSON.stringify(user));
    await kv.put(`username:${username.toLowerCase()}`, id);
    await kv.put(`email:${email.toLowerCase()}`, id);
  } catch (err) {
    // Best-effort rollback
    try {
      await kv.delete(`user:${id}`);
      await kv.delete(`username:${username.toLowerCase()}`);
      await kv.delete(`email:${email.toLowerCase()}`);
    } catch (_) {
      // Swallow rollback errors
    }
    console.error('Failed to create user:', err);
    return c.json({ error: 'Failed to create user account' }, 500);
  }

  // Log new registration for admin notification (email redacted for privacy)
  const redactedEmail = email.toLowerCase().replace(/^(.).*(@.*)$/, '$1***$2');
  console.log(`[AUTH] New user registration pending approval: id=${id}, username=${username}, email=${redactedEmail}`);

  return c.json({
    success: true,
    message: 'Registration successful. Your account is pending admin approval. You will not be able to log in until an administrator activates your account.',
    userId: id,
    status: user.status
  });
});

/**
 * User login
 * POST /api/auth/login
 */
auth.post('/login', authLoginRateLimit, async (c) => {
  const kv = c.env.KV;
  if (!kv) {
    return c.json({ error: 'Storage not configured' }, 500);
  }

  const body = await c.req.json().catch(() => ({}));
  const { username, password } = body;

  if (!username || !password) {
    return c.json({ error: 'Username and password are required' }, 400);
  }

  // Get user by username
  const user = await getUserByUsername(kv, username);
  if (!user) {
    return c.json({ error: 'Invalid username or password' }, 401);
  }

  // Verify password
  const isValid = await verifyPassword(password, user.passwordHash, user.passwordSalt);
  if (!isValid) {
    return c.json({ error: 'Invalid username or password' }, 401);
  }

  // Check user status
  if (user.status === 'pending') {
    return c.json({
      error: 'Account pending approval',
      message: 'Your account is awaiting admin approval. Please try again later.'
    }, 403);
  }

  if (user.status === 'suspended' || user.status === 'banned') {
    return c.json({
      error: 'Account suspended',
      message: 'Your account has been suspended. Please contact an administrator.'
    }, 403);
  }
  const sessionData = await createSessionForUser(kv, user);

  return c.json({
    success: true,
    data: sessionData
  });
});

/**
 * Start OAuth flow
 * GET /api/auth/oauth/:provider/start
 */
auth.get('/oauth/:provider/start', async (c) => {
  const provider = c.req.param('provider');
  const kv = c.env.KV;
  const requestUrl = new URL(c.req.url);

  if (!kv) {
    return c.json({ error: 'Storage not configured' }, 500);
  }

  if (!isSupportedOAuthProvider(provider)) {
    return c.json({ error: 'Unsupported OAuth provider' }, 404);
  }

  const oauthSecret = getOAuthSecret(c.env);
  if (!oauthSecret) {
    return c.json({ error: 'OAuth secret not configured' }, 500);
  }

  const providerConfig = getOAuthProviderConfig(provider, c.env, requestUrl.origin);
  if (!providerConfig) {
    return c.json({ error: 'OAuth provider is not configured' }, 500);
  }

  const allowedOrigins = parseAllowedOrigins(c.env?.CORS_ALLOWED_ORIGINS);
  const appOrigin = normalizeAppOrigin(
    c.req.query('app_origin') || requestUrl.origin,
    allowedOrigins,
    requestUrl.origin
  );
  const returnTo = normalizeReturnTo(c.req.query('return_to'));
  const state = generateRandomToken(32);
  const codeVerifier = generatePkceVerifier();
  const codeChallenge = await createPkceChallenge(codeVerifier);
  const cookiePath = `/api/auth/oauth/${provider}`;
  const stateToken = await createSignedToken(oauthSecret, {
    type: 'oauth-state',
    provider,
    state,
    codeVerifier,
    appOrigin,
    returnTo,
    exp: Date.now() + OAUTH_STATE_TTL_MS
  });

  setCookie(c, `${OAUTH_STATE_COOKIE_PREFIX}${provider}`, stateToken, getCookieOptions(requestUrl, cookiePath));

  const authorizationUrl = new URL(providerConfig.authorizeUrl);
  authorizationUrl.searchParams.set('client_id', providerConfig.clientId);
  authorizationUrl.searchParams.set('redirect_uri', providerConfig.callbackUrl);
  authorizationUrl.searchParams.set('response_type', 'code');
  authorizationUrl.searchParams.set('scope', providerConfig.scopes.join(' '));
  authorizationUrl.searchParams.set('state', state);
  authorizationUrl.searchParams.set('code_challenge', codeChallenge);
  authorizationUrl.searchParams.set('code_challenge_method', 'S256');
  authorizationUrl.searchParams.set('prompt', 'select_account');

  return c.redirect(authorizationUrl.toString(), 302);
});

/**
 * OAuth callback
 * GET /api/auth/oauth/:provider/callback
 */
auth.get('/oauth/:provider/callback', async (c) => {
  const provider = c.req.param('provider');
  const kv = c.env.KV;
  const requestUrl = new URL(c.req.url);
  const fallbackAppOrigin = requestUrl.origin;
  const cookiePath = `/api/auth/oauth/${provider}`;

  if (!kv) {
    return c.json({ error: 'Storage not configured' }, 500);
  }

  if (!isSupportedOAuthProvider(provider)) {
    return c.json({ error: 'Unsupported OAuth provider' }, 404);
  }

  const oauthSecret = getOAuthSecret(c.env);
  if (!oauthSecret) {
    return c.json({ error: 'OAuth secret not configured' }, 500);
  }

  const providerConfig = getOAuthProviderConfig(provider, c.env, requestUrl.origin);
  if (!providerConfig) {
    return c.json({ error: 'OAuth provider is not configured' }, 500);
  }

  const rawStateToken = getCookie(c, `${OAUTH_STATE_COOKIE_PREFIX}${provider}`);
  deleteCookie(c, `${OAUTH_STATE_COOKIE_PREFIX}${provider}`, getDeleteCookieOptions(requestUrl, cookiePath));

  const redirectWithResult = async (payload) => {
    const completionPayload = {
      ...payload,
      provider,
      appOrigin: payload.appOrigin || fallbackAppOrigin,
      returnTo: normalizeReturnTo(payload.returnTo)
    };
    const completionToken = await buildCompletionToken(c.env, completionPayload);

    return c.redirect(
      buildCompletionRedirectUrl(completionPayload.appOrigin, completionToken),
      302
    );
  };

  const statePayload = await verifySignedToken(oauthSecret, rawStateToken);
  const callbackState = c.req.query('state');
  const authorizationCode = c.req.query('code');
  const callbackError = c.req.query('error');

  if (!statePayload || statePayload.type !== 'oauth-state' || statePayload.provider !== provider || !callbackState || statePayload.state !== callbackState) {
    return redirectWithResult({
      type: 'error',
      statusCode: 400,
      message: 'Google sign-in could not be verified. Please try again.',
      appOrigin: fallbackAppOrigin,
      returnTo: '/'
    });
  }

  if (callbackError || !authorizationCode) {
    return redirectWithResult({
      type: 'error',
      statusCode: 400,
      message: callbackError === 'access_denied'
        ? 'Google sign-in was canceled.'
        : 'Google sign-in failed before we received an authorization code.',
      appOrigin: statePayload.appOrigin,
      returnTo: statePayload.returnTo
    });
  }

  let googleProfile = null;

  try {
    const tokenResponse = await fetch(providerConfig.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        code: authorizationCode,
        client_id: providerConfig.clientId,
        client_secret: providerConfig.clientSecret,
        redirect_uri: providerConfig.callbackUrl,
        grant_type: 'authorization_code',
        code_verifier: statePayload.codeVerifier
      })
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('OAuth token exchange failed:', errorText);
      return redirectWithResult({
        type: 'error',
        statusCode: 502,
        message: 'Google sign-in failed during token exchange.',
        appOrigin: statePayload.appOrigin,
        returnTo: statePayload.returnTo
      });
    }

    const tokenData = await tokenResponse.json();
    const userInfoResponse = await fetch(providerConfig.userInfoUrl, {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`
      }
    });

    if (!userInfoResponse.ok) {
      const errorText = await userInfoResponse.text();
      console.error('OAuth user info fetch failed:', errorText);
      return redirectWithResult({
        type: 'error',
        statusCode: 502,
        message: 'Google sign-in failed while loading your profile.',
        appOrigin: statePayload.appOrigin,
        returnTo: statePayload.returnTo
      });
    }

    googleProfile = await userInfoResponse.json();
  } catch (error) {
    console.error('Unexpected OAuth callback error:', error);
    return redirectWithResult({
      type: 'error',
      statusCode: 500,
      message: 'Google sign-in failed unexpectedly. Please try again.',
      appOrigin: statePayload.appOrigin,
      returnTo: statePayload.returnTo
    });
  }

  if (!googleProfile?.sub || !googleProfile?.email || !googleProfile?.email_verified) {
    return redirectWithResult({
      type: 'error',
      statusCode: 400,
      message: 'Google did not return a verified email address for this account.',
      appOrigin: statePayload.appOrigin,
      returnTo: statePayload.returnTo
    });
  }

  const resolution = await resolveGoogleUser(kv, googleProfile);
  if (resolution.error) {
    return redirectWithResult({
      type: 'conflict',
      statusCode: 409,
      message: resolution.error,
      appOrigin: statePayload.appOrigin,
      returnTo: statePayload.returnTo
    });
  }

  const user = updateLinkedProvider(resolution.user, 'google', googleProfile.sub, {
    email: googleProfile.email.toLowerCase(),
    emailVerified: !!googleProfile.email_verified,
    picture: googleProfile.picture || null
  });
  user.profile = {
    ...(user.profile || {}),
    name: googleProfile.name || user.profile?.name || null,
    givenName: googleProfile.given_name || user.profile?.givenName || null,
    familyName: googleProfile.family_name || user.profile?.familyName || null,
    picture: googleProfile.picture || user.profile?.picture || null
  };
  user.updated_at = nowIso();

  await kv.put(`user:${user.id}`, JSON.stringify(user));
  await kv.put(`oauth:google:${googleProfile.sub}`, user.id);

  if (user.status === 'pending') {
    return redirectWithResult({
      type: 'pending',
      statusCode: 200,
      userId: user.id,
      message: resolution.created
        ? 'Google sign-up succeeded. Your account is pending admin approval before you can sign in.'
        : 'Your Google-linked account is still pending admin approval.',
      appOrigin: statePayload.appOrigin,
      returnTo: statePayload.returnTo
    });
  }

  if (user.status === 'suspended' || user.status === 'banned') {
    return redirectWithResult({
      type: 'error',
      statusCode: 403,
      message: 'Your account is not active. Please contact an administrator.',
      appOrigin: statePayload.appOrigin,
      returnTo: statePayload.returnTo
    });
  }

  return redirectWithResult({
    type: 'login',
    statusCode: 200,
    userId: user.id,
    provider: 'google',
    appOrigin: statePayload.appOrigin,
    returnTo: statePayload.returnTo
  });
});

/**
 * Complete OAuth handoff
 * POST /api/auth/oauth/complete
 */
auth.post('/oauth/complete', async (c) => {
  const kv = c.env.KV;
  if (!kv) {
    return c.json({ error: 'Storage not configured' }, 500);
  }

  const oauthSecret = getOAuthSecret(c.env);
  if (!oauthSecret) {
    return c.json({ error: 'OAuth secret not configured' }, 500);
  }

  const body = await c.req.json().catch(() => ({}));
  const resultToken = typeof body.resultToken === 'string' ? body.resultToken : '';
  const payload = await verifySignedToken(oauthSecret, resultToken);
  const requestOrigin = c.req.header('Origin');

  if (!payload) {
    return c.json({ error: 'OAuth completion token is invalid or expired' }, 400);
  }

  if (requestOrigin && payload.appOrigin && requestOrigin !== payload.appOrigin) {
    return c.json({ error: 'OAuth completion request origin is not allowed' }, 403);
  }

  if (payload.type === 'login') {
    const user = await kv.get(`user:${payload.userId}`, 'json');
    if (!user) {
      return c.json({ error: 'Account not found' }, 404);
    }

    if (user.status === 'pending') {
      return c.json({
        success: false,
        status: 'pending',
        message: 'Your account is awaiting admin approval.',
        returnTo: '/'
      });
    }

    if (user.status === 'suspended' || user.status === 'banned') {
      return c.json({ error: 'Your account is not active.' }, 403);
    }

    const sessionData = await createSessionForUser(kv, user, payload.provider || null);
    return c.json({
      success: true,
      data: {
        ...sessionData,
        returnTo: normalizeReturnTo(payload.returnTo)
      }
    });
  }

  if (payload.type === 'pending') {
    return c.json({
      success: false,
      status: 'pending',
      message: payload.message || 'Your account is awaiting admin approval.',
      returnTo: '/'
    });
  }

  if (payload.type === 'conflict') {
    return c.json({
      error: payload.message || 'An account conflict prevented Google sign-in.'
    }, payload.statusCode || 409);
  }

  return c.json({
    error: payload.message || 'Google sign-in failed.'
  }, payload.statusCode || 400);
});

/**
 * User logout
 * POST /api/auth/logout
 */
auth.post('/logout', requireAuth, async (c) => {
  const kv = c.env.KV;
  const token = c.get('token');
  const user = c.get('user');

  if (kv && token && token.startsWith('sess_')) {
    const tokenHash = await hashToken(token);
    await kv.delete(`session:${tokenHash}`);
    await removeUserSessionIndex(kv, user?.id, tokenHash);
  }

  return c.json({ success: true });
});

/**
 * Get current user
 * GET /api/auth/me
 */
auth.get('/me', requireAuth, async (c) => {
  const user = c.get('user');
  return c.json({
    success: true,
    data: { user: sanitizeUser(user) }
  });
});

/**
 * Create API key
 * POST /api/auth/api-keys
 */
auth.post('/api-keys', requireAuth, async (c) => {
  const kv = c.env.KV;
  const user = c.get('user');

  if (!kv) {
    return c.json({ error: 'Storage not configured' }, 500);
  }

  const body = await c.req.json().catch(() => ({}));
  
  // Validate API key name
  let keyName = typeof body.name === 'string' ? body.name.trim() : '';
  if (keyName) {
    if (keyName.length > 100) {
      return c.json({ error: 'API key name must be at most 100 characters long' }, 400);
    }
    // Allow letters, numbers, spaces, underscores, hyphens, and periods
    if (!/^[\w .-]+$/.test(keyName)) {
      return c.json({ error: 'API key name contains invalid characters' }, 400);
    }
  } else {
    keyName = `API Key ${Date.now()}`;
  }

  // Generate API key
  const apiKey = generateApiKey();
  const keyHash = await hashToken(apiKey);
  const keyPrefix = getTokenPrefix(apiKey);

  const keyData = {
    id: crypto.randomUUID(),
    userId: user.id,
    name: keyName,
    keyHash,
    keyPrefix,
    created_at: nowIso(),
    last_used: null
  };

  // Store the API key with rollback on failure
  try {
    await kv.put(`apikey:${keyHash}`, JSON.stringify(keyData));

    // Store reference in user's key list (include keyHash for efficient deletion)
    const userKeysKey = `userkeys:${user.id}`;
    const existingKeys = await kv.get(userKeysKey, 'json') || [];
    existingKeys.push({
      id: keyData.id,
      name: keyData.name,
      keyPrefix: keyData.keyPrefix,
      keyHash: keyData.keyHash,
      created_at: keyData.created_at
    });
    await kv.put(userKeysKey, JSON.stringify(existingKeys));

    return c.json({
      success: true,
      data: {
        key: apiKey, // Only shown once
        id: keyData.id,
        name: keyData.name,
        prefix: keyData.keyPrefix
      }
    });
  } catch (err) {
    // Rollback API key creation if updating the user's key list fails
    try {
      await kv.delete(`apikey:${keyHash}`);
    } catch (rollbackErr) {
      console.error('Failed to rollback API key creation:', rollbackErr);
    }
    console.error('Failed to create API key:', err);
    return c.json({ error: 'Failed to create API key' }, 500);
  }
});

/**
 * List API keys
 * GET /api/auth/api-keys
 */
auth.get('/api-keys', requireAuth, async (c) => {
  const kv = c.env.KV;
  const user = c.get('user');

  if (!kv) {
    return c.json({ error: 'Storage not configured' }, 500);
  }

  const userKeysKey = `userkeys:${user.id}`;
  const keys = await kv.get(userKeysKey, 'json') || [];

  // Remove keyHash from response (don't expose to client)
  const safeKeys = keys.map(({ keyHash, ...rest }) => rest);

  return c.json({
    success: true,
    data: safeKeys
  });
});

/**
 * Delete API key
 * DELETE /api/auth/api-keys/:keyId
 */
auth.delete('/api-keys/:keyId', requireAuth, async (c) => {
  const kv = c.env.KV;
  const user = c.get('user');
  const keyId = c.req.param('keyId');

  if (!kv) {
    return c.json({ error: 'Storage not configured' }, 500);
  }

  // Get user's keys
  const userKeysKey = `userkeys:${user.id}`;
  const existingKeys = await kv.get(userKeysKey, 'json') || [];

  // Find the key to delete
  const keyIndex = existingKeys.findIndex(k => k.id === keyId);
  if (keyIndex === -1) {
    return c.json({ error: 'API key not found' }, 404);
  }

  const keyToDelete = existingKeys[keyIndex];

  // Delete the actual API key entry
  // Try using stored keyHash first (new keys), fallback to scanning (legacy keys)
  if (keyToDelete.keyHash) {
    await kv.delete(`apikey:${keyToDelete.keyHash}`);
  } else {
    // Fallback: scan for legacy keys without stored keyHash
    const apiKeyList = await kv.list({ prefix: 'apikey:' });
    for (const key of apiKeyList.keys) {
      const keyData = await kv.get(key.name, 'json');
      if (keyData && keyData.id === keyId && keyData.userId === user.id) {
        await kv.delete(key.name);
        break;
      }
    }
  }

  // Remove from user's key list
  existingKeys.splice(keyIndex, 1);
  await kv.put(userKeysKey, JSON.stringify(existingKeys));

  return c.json({ success: true });
});

export default auth;
