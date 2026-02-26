/**
 * URL validation helpers for outbound fetch security controls.
 * Blocks non-HTTPS URLs, localhost/private IP targets, and disallowed hosts.
 */

const PRIVATE_IPV4_RANGES = [
  { start: '10.0.0.0', end: '10.255.255.255' },
  { start: '127.0.0.0', end: '127.255.255.255' },
  { start: '169.254.0.0', end: '169.254.255.255' },
  { start: '172.16.0.0', end: '172.31.255.255' },
  { start: '192.168.0.0', end: '192.168.255.255' },
  { start: '0.0.0.0', end: '0.255.255.255' }
];

const LOCAL_HOSTS = new Set(['localhost', 'localhost.localdomain']);

const ipv4ToNumber = (ip) => {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part) || part < 0 || part > 255)) {
    return null;
  }

  return (
    ((parts[0] << 24) >>> 0) +
    ((parts[1] << 16) >>> 0) +
    ((parts[2] << 8) >>> 0) +
    (parts[3] >>> 0)
  );
};

const isPrivateIPv4 = (ip) => {
  const ipNumber = ipv4ToNumber(ip);
  if (ipNumber === null) return false;

  for (const range of PRIVATE_IPV4_RANGES) {
    const start = ipv4ToNumber(range.start);
    const end = ipv4ToNumber(range.end);
    if (start === null || end === null) continue;
    if (ipNumber >= start && ipNumber <= end) return true;
  }

  return false;
};

const isIpLiteral = (hostname) => {
  if (!hostname) return false;
  // IPv6 literals in URL.hostname are not bracketed.
  return /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname) || hostname.includes(':');
};

const matchesHostPattern = (hostname, pattern) => {
  const normalizedHost = hostname.toLowerCase();
  const normalizedPattern = pattern.toLowerCase();

  if (normalizedPattern.startsWith('*.')) {
    const base = normalizedPattern.slice(2);
    return normalizedHost === base || normalizedHost.endsWith(`.${base}`);
  }

  return normalizedHost === normalizedPattern;
};

export const validateOutboundUrl = (rawUrl, allowedHostPatterns = []) => {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { valid: false, reason: 'Invalid URL format' };
  }

  if (parsed.protocol !== 'https:') {
    return { valid: false, reason: 'Only HTTPS URLs are allowed' };
  }

  if (parsed.username || parsed.password) {
    return { valid: false, reason: 'Credentials in URL are not allowed' };
  }

  const hostname = parsed.hostname.toLowerCase();

  if (LOCAL_HOSTS.has(hostname) || hostname.endsWith('.local') || hostname.endsWith('.internal')) {
    return { valid: false, reason: 'Local/internal hostnames are not allowed' };
  }

  if (isIpLiteral(hostname)) {
    // Block all IPv6 literal hosts and private IPv4 ranges.
    if (hostname.includes(':')) {
      return { valid: false, reason: 'IP literal hosts are not allowed' };
    }
    if (isPrivateIPv4(hostname)) {
      return { valid: false, reason: 'Private network IPs are not allowed' };
    }
  }

  if (allowedHostPatterns.length > 0) {
    const isAllowed = allowedHostPatterns.some((pattern) => matchesHostPattern(hostname, pattern));
    if (!isAllowed) {
      return { valid: false, reason: 'Host is not in the allowlist' };
    }
  }

  return { valid: true, url: parsed };
};
