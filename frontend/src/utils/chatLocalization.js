import translations, { translateText } from '../i18n/translations';

const DEFAULT_CHAT_TITLES = new Set(
  Object.values(translations)
    .map(locale => locale?.['chat.defaultTitle'])
    .filter(Boolean)
);

const FALLBACK_DEFAULT_TITLE = translations['en-US']['chat.defaultTitle'];

export const getDefaultChatTitle = (language = 'en-US') =>
  translateText(language, 'chat.defaultTitle', FALLBACK_DEFAULT_TITLE);

export const isDefaultChatTitle = (title) => DEFAULT_CHAT_TITLES.has(title);

export default DEFAULT_CHAT_TITLES;
