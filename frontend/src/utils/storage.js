const warnedStorageFailures = new Set();

const isQuotaExceededError = (error) => (
  error instanceof DOMException &&
  (
    error.name === 'QuotaExceededError' ||
    error.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
    error.code === 22 ||
    error.code === 1014
  )
);

const warnStorageFailure = (action, storageName, key, error) => {
  const reason = isQuotaExceededError(error) ? 'quota exceeded' : 'storage unavailable';
  const signature = `${action}:${storageName}:${key}:${reason}`;

  if (warnedStorageFailures.has(signature)) {
    return;
  }

  warnedStorageFailures.add(signature);
  console.warn(`[storage] Failed to ${action} "${key}" in ${storageName}: ${reason}.`, error);
};

const getStorage = (kind) => {
  const storageName = kind === 'session' ? 'sessionStorage' : 'localStorage';

  try {
    if (typeof globalThis === 'undefined') {
      return null;
    }

    return kind === 'session' ? globalThis.sessionStorage : globalThis.localStorage;
  } catch (error) {
    warnStorageFailure('access', storageName, '(storage)', error);
    return null;
  }
};

const readStorageItem = (kind, key) => {
  const storage = getStorage(kind);
  const storageName = kind === 'session' ? 'sessionStorage' : 'localStorage';

  if (!storage) {
    return null;
  }

  try {
    return storage.getItem(key);
  } catch (error) {
    warnStorageFailure('read', storageName, key, error);
    return null;
  }
};

const writeStorageItem = (kind, key, value) => {
  const storage = getStorage(kind);
  const storageName = kind === 'session' ? 'sessionStorage' : 'localStorage';

  if (!storage) {
    return false;
  }

  try {
    if (value == null) {
      storage.removeItem(key);
    } else {
      storage.setItem(key, String(value));
    }
    return true;
  } catch (error) {
    warnStorageFailure('write', storageName, key, error);
    return false;
  }
};

const removeStorageItem = (kind, key) => {
  const storage = getStorage(kind);
  const storageName = kind === 'session' ? 'sessionStorage' : 'localStorage';

  if (!storage) {
    return false;
  }

  try {
    storage.removeItem(key);
    return true;
  } catch (error) {
    warnStorageFailure('remove', storageName, key, error);
    return false;
  }
};

export const readLocalStorageItem = (key) => readStorageItem('local', key);

export const readLocalStorageJSON = (key, fallbackValue = null) => {
  const rawValue = readStorageItem('local', key);

  if (rawValue == null) {
    return fallbackValue;
  }

  try {
    return JSON.parse(rawValue);
  } catch (error) {
    warnStorageFailure('parse', 'localStorage', key, error);
    return fallbackValue;
  }
};

export const writeLocalStorageItem = (key, value) => writeStorageItem('local', key, value);

export const removeLocalStorageItem = (key) => removeStorageItem('local', key);
