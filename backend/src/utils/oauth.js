const OAUTH_PROVIDERS = {
  google: {
    authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    userInfoUrl: 'https://openidconnect.googleapis.com/v1/userinfo',
    scopes: ['openid', 'email', 'profile'],
    clientIdEnv: 'GOOGLE_OAUTH_CLIENT_ID',
    clientSecretEnv: 'GOOGLE_OAUTH_CLIENT_SECRET'
  }
};

const encoder = new TextEncoder();

const base64UrlEncode = (input) => {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  let binary = '';

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
};

const base64UrlDecode = (value) => {
  const normalized = value
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(Math.ceil(value.length / 4) * 4, '=');

  const binary = atob(normalized);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
};

const importHmacKey = async (secret) => {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
};

export const createSignedToken = async (secret, payload) => {
  const json = JSON.stringify(payload);
  const encodedPayload = base64UrlEncode(encoder.encode(json));
  const key = await importHmacKey(secret);
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(encodedPayload));

  return `${encodedPayload}.${base64UrlEncode(signature)}`;
};

export const verifySignedToken = async (secret, token) => {
  if (!secret || !token || typeof token !== 'string' || !token.includes('.')) {
    return null;
  }

  const [encodedPayload, encodedSignature] = token.split('.', 2);
  if (!encodedPayload || !encodedSignature) {
    return null;
  }

  const key = await importHmacKey(secret);
  const isValid = await crypto.subtle.verify(
    'HMAC',
    key,
    base64UrlDecode(encodedSignature),
    encoder.encode(encodedPayload)
  );

  if (!isValid) {
    return null;
  }

  try {
    const payloadJson = new TextDecoder().decode(base64UrlDecode(encodedPayload));
    const payload = JSON.parse(payloadJson);

    if (typeof payload?.exp === 'number' && Date.now() > payload.exp) {
      return null;
    }

    return payload;
  } catch (error) {
    console.error('Failed to parse signed OAuth token:', error);
    return null;
  }
};

export const generateRandomToken = (byteLength = 32) => {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
};

export const generatePkceVerifier = () => generateRandomToken(64);

export const createPkceChallenge = async (verifier) => {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(verifier));
  return base64UrlEncode(digest);
};

export const getOAuthProviderConfig = (provider, env, requestOrigin) => {
  const config = OAUTH_PROVIDERS[provider];
  if (!config) {
    return null;
  }

  const clientId = env?.[config.clientIdEnv];
  const clientSecret = env?.[config.clientSecretEnv];

  if (!clientId || !clientSecret) {
    return null;
  }

  return {
    ...config,
    clientId,
    clientSecret,
    callbackUrl: `${requestOrigin}/api/auth/oauth/${provider}/callback`
  };
};

export const isSupportedOAuthProvider = (provider) => Boolean(OAUTH_PROVIDERS[provider]);
