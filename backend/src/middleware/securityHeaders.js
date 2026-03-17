/**
 * API response security headers.
 */

export const apiSecurityHeaders = async (c, next) => {
  await next();

  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
  c.header('Referrer-Policy', 'no-referrer');
  c.header('Permissions-Policy', 'camera=(self), microphone=(self), display-capture=(self), on-device-speech-recognition=(self), geolocation=()');
  c.header('Cross-Origin-Resource-Policy', 'same-origin');
  c.header('Cache-Control', 'no-store');

  if (c.req.url.startsWith('https://')) {
    c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
};
