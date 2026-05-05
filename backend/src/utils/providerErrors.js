const SECRET_PATTERNS = [
  /sk-[A-Za-z0-9_-]{12,}/g,
  /AIza[0-9A-Za-z_-]{20,}/g,
  /(key=)[^&\s]+/gi,
  /(api[_-]?key["':\s=]+)[^"',\s&]+/gi,
  /(authorization:\s*bearer\s+)[^"',\s]+/gi,
  /(x-api-key:\s*)[^"',\s]+/gi
];

export function sanitizeErrorMessage(value, fallback = 'Provider request failed') {
  const raw = value instanceof Error
    ? value.message
    : (typeof value === 'string' ? value : String(value || ''));
  const message = raw.trim() || fallback;

  return SECRET_PATTERNS.reduce(
    (current, pattern) => current.replace(pattern, '$1[redacted]'),
    message
  ).slice(0, 500);
}

export function providerInternalError(c, provider, error) {
  const message = sanitizeErrorMessage(error, `${provider} request failed`);
  console.error(`${provider} handler error:`, message);

  return c.json({
    error: `${provider} request failed: ${message}`,
    provider,
    code: 'provider_request_failed'
  }, 500);
}
