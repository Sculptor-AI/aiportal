export const RESERVED_CHAT_ROUTE_SEGMENTS = new Set([
  'admin',
  'artifact',
  'auth',
  'media',
  'model',
  'news',
  'projects',
  'share',
  'share-view',
  'workspace'
]);

const trimSlashes = (value = '') => value.replace(/^\/+|\/+$/g, '');

export const isUrlSafeChatId = (chatId) => (
  typeof chatId === 'string' &&
  /^[A-Za-z0-9][A-Za-z0-9_-]{5,127}$/.test(chatId) &&
  !RESERVED_CHAT_ROUTE_SEGMENTS.has(chatId.toLowerCase())
);

export const getChatIdFromPathname = (pathname = '') => {
  const cleanPath = trimSlashes(pathname.split('?')[0].split('#')[0]);
  if (!cleanPath || cleanPath.includes('/')) return null;

  try {
    const decodedPath = decodeURIComponent(cleanPath);
    if (!isUrlSafeChatId(decodedPath)) return null;

    return decodedPath;
  } catch (error) {
    return null;
  }
};

export const getChatPath = (chatId) => `/${encodeURIComponent(chatId)}`;
