const DB_NAME = 'aiportal-knowledge';
const DB_VERSION = 1;
const STORE = 'files';

let dbPromise = null;

function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not available in this environment'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' });
        store.createIndex('projectId', 'projectId', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx(mode) {
  return openDB().then(db => db.transaction(STORE, mode).objectStore(STORE));
}

function promisify(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function putKnowledge(entry) {
  const store = await tx('readwrite');
  await promisify(store.put(entry));
  return entry;
}

export async function getKnowledge(id) {
  const store = await tx('readonly');
  return promisify(store.get(id));
}

export async function getKnowledgeForProject(projectId) {
  const store = await tx('readonly');
  const idx = store.index('projectId');
  return promisify(idx.getAll(IDBKeyRange.only(projectId)));
}

export async function deleteKnowledge(id) {
  const store = await tx('readwrite');
  await promisify(store.delete(id));
}

export async function deleteKnowledgeForProject(projectId) {
  const items = await getKnowledgeForProject(projectId);
  const store = await tx('readwrite');
  await Promise.all(items.map(item => promisify(store.delete(item.id))));
}

export async function getKnowledgeContentsForProject(projectId) {
  const items = await getKnowledgeForProject(projectId);
  return items
    .filter(i => i.content && typeof i.content === 'string')
    .map(i => ({ id: i.id, name: i.name, type: i.type, content: i.content, tokens: i.tokens }));
}
