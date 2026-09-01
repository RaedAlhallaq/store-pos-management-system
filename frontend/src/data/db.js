const DB_NAME = 'store_pos_local';
const DB_VERSION = 1;

export const STORE_NAMES = [
  'users',
  'settings',
  'categories',
  'units',
  'products',
  'customers',
  'customerPayments',
  'customerTransactions',
  'suppliers',
  'supplierPayments',
  'supplierTransactions',
  'sales',
  'purchases',
  'stockMovements',
  'expenses',
  'expenseCategories',
  'cashSessions',
  'cashMovements',
  'meta',
];

let dbPromise = null;

function openDatabase() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      STORE_NAMES.forEach((name) => {
        if (!db.objectStoreNames.contains(name)) {
          db.createObjectStore(name, { keyPath: 'id', autoIncrement: true });
        }
      });
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return dbPromise;
}

function run(storeName, mode, executor) {
  return openDatabase().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, mode);
        const store = tx.objectStore(storeName);
        const request = executor(store);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      })
  );
}

export const db = {
  open: openDatabase,

  getAll(storeName) {
    return run(storeName, 'readonly', (store) => store.getAll());
  },

  get(storeName, id) {
    return run(storeName, 'readonly', (store) => store.get(Number(id)));
  },

  put(storeName, record) {
    return run(storeName, 'readwrite', (store) => store.put(record));
  },

  add(storeName, record) {
    return run(storeName, 'readwrite', (store) => store.add(record));
  },

  delete(storeName, id) {
    return run(storeName, 'readwrite', (store) => store.delete(Number(id)));
  },

  async clear(storeName) {
    const dbConn = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = dbConn.transaction(storeName, 'readwrite');
      const request = tx.objectStore(storeName).clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async exportAll() {
    const payload = {};
    for (const name of STORE_NAMES) {
      payload[name] = await this.getAll(name);
    }
    return payload;
  },

  async importAll(payload) {
    for (const name of STORE_NAMES) {
      await this.clear(name);
      const rows = Array.isArray(payload?.[name]) ? payload[name] : [];
      for (const row of rows) {
        await this.put(name, row);
      }
    }
  },
};
