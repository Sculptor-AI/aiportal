const SAFE_AVATAR_IMAGE_RE = /^data:image\/(?:png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=]+$/;

export const safeAvatarImageSrc = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return SAFE_AVATAR_IMAGE_RE.test(trimmed) ? trimmed : null;
};
