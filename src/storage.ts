const DATABASE_NAME = 'metric-life-os'
const STORE_NAME = 'app-state'
const DATABASE_VERSION = 2

interface StoredValue {
  key: string
  value: unknown
}

function openDatabase() {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('IndexedDB is not available in this browser.'))
  }

  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION)
    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'key' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Unable to open IndexedDB.'))
  })
}

export async function readPersistedState<T>(key: string) {
  const database = await openDatabase()

  return new Promise<T | undefined>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readonly')
    const request = transaction.objectStore(STORE_NAME).get(key)
    let value: T | undefined

    request.onsuccess = () => {
      const storedValue = request.result as StoredValue | undefined
      value = storedValue?.value as T | undefined
    }
    transaction.oncomplete = () => {
      database.close()
      resolve(value)
    }
    transaction.onerror = () => {
      database.close()
      reject(transaction.error ?? new Error('Unable to read IndexedDB.'))
    }
    transaction.onabort = () => {
      database.close()
      reject(transaction.error ?? new Error('IndexedDB read was aborted.'))
    }
  })
}

export async function writePersistedState<T>(key: string, value: T) {
  const database = await openDatabase()

  return new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite')
    transaction.objectStore(STORE_NAME).put({ key, value } satisfies StoredValue)
    transaction.oncomplete = () => {
      database.close()
      resolve()
    }
    transaction.onerror = () => {
      database.close()
      reject(transaction.error ?? new Error('Unable to write IndexedDB.'))
    }
    transaction.onabort = () => {
      database.close()
      reject(transaction.error ?? new Error('IndexedDB write was aborted.'))
    }
  })
}