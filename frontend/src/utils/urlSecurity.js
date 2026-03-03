export const sanitizeExternalUrl = (rawUrl) => {
  if (!rawUrl || typeof rawUrl !== 'string') return null;

  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'https:') return null;
    return parsed.toString();
  } catch {
    return null;
  }
};

export const openExternalUrl = (rawUrl) => {
  const safeUrl = sanitizeExternalUrl(rawUrl);
  if (!safeUrl) return false;
  window.open(safeUrl, '_blank', 'noopener,noreferrer');
  return true;
};
