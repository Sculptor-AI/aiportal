import { v4 as uuidv4 } from 'uuid';
import {
  readLocalStorageItem,
  removeLocalStorageItem,
  writeLocalStorageItem
} from './storage.js';
import { isUrlSafeChatId } from './chatRoutes.js';

export const CHAT_URL_MIGRATION_KEY = 'chatUrlMigrationVersion';
export const CHAT_URL_MIGRATION_VERSION = '1';
export const CHAT_URL_MIGRATION_BACKUP_KEY = 'chatsBeforeUrlMigration';
export const CHAT_URL_LEGACY_ACTIVE_CHAT_KEY = 'activeChatBeforeUrlMigration';

const normalizeMessages = (messages) => Array.isArray(messages) ? messages : [];

const ensureUniqueUrlSafeId = (candidateId, usedIds) => {
  if (isUrlSafeChatId(candidateId) && !usedIds.has(candidateId)) {
    usedIds.add(candidateId);
    return candidateId;
  }

  let nextId = uuidv4();
  while (usedIds.has(nextId)) {
    nextId = uuidv4();
  }
  usedIds.add(nextId);
  return nextId;
};

export const normalizeStoredChatsForUrls = (rawChats, createDefaultChat) => {
  const sourceChats = Array.isArray(rawChats) ? rawChats : [];
  const usedIds = new Set();

  const normalizedChats = sourceChats
    .filter(chat => chat && typeof chat === 'object')
    .map((chat) => ({
      ...chat,
      id: ensureUniqueUrlSafeId(chat.id, usedIds),
      title: typeof chat.title === 'string' && chat.title.trim()
        ? chat.title
        : createDefaultChat().title,
      messages: normalizeMessages(chat.messages)
    }));

  if (normalizedChats.length > 0) {
    return normalizedChats;
  }

  return [createDefaultChat()];
};

const preserveLegacyChatStorage = (savedChats) => {
  if (savedChats && !readLocalStorageItem(CHAT_URL_MIGRATION_BACKUP_KEY)) {
    writeLocalStorageItem(CHAT_URL_MIGRATION_BACKUP_KEY, savedChats);
  }

  const legacyActiveChat = readLocalStorageItem('activeChat');
  if (legacyActiveChat && !readLocalStorageItem(CHAT_URL_LEGACY_ACTIVE_CHAT_KEY)) {
    writeLocalStorageItem(CHAT_URL_LEGACY_ACTIVE_CHAT_KEY, legacyActiveChat);
  }
};

export const loadMigratedLocalChats = (createDefaultChat) => {
  const savedChats = readLocalStorageItem('chats');
  preserveLegacyChatStorage(savedChats);

  let parsedChats = [];
  try {
    parsedChats = savedChats ? JSON.parse(savedChats) : [];
  } catch (err) {
    console.error('Error loading chats from localStorage:', err);
  }

  const migratedChats = normalizeStoredChatsForUrls(parsedChats, createDefaultChat);
  writeLocalStorageItem('chats', JSON.stringify(migratedChats));
  writeLocalStorageItem(CHAT_URL_MIGRATION_KEY, CHAT_URL_MIGRATION_VERSION);
  removeLocalStorageItem('activeChat');

  return migratedChats;
};
