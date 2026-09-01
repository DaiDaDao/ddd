export async function readPersistedState<T>(key: string) {
  if (typeof localStorage === 'undefined') return undefined
  const storedValue = localStorage.getItem(key)
  return storedValue ? JSON.parse(storedValue) as T : undefined
}

export async function writePersistedState<T>(key: string, value: T) {
  if (typeof localStorage === 'undefined') throw new Error('localStorage is not available in this browser.')
  localStorage.setItem(key, JSON.stringify(value))
}