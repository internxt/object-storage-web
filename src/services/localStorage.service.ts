export const LOCAL_STORAGE_KEYS = {
  USER_TOKEN: 'userToken',
}

export const set = (key: string, value: string): void => {
  localStorage.setItem(key, JSON.stringify(value))
}

export const get = (key: string): string | null => {
  const value = localStorage.getItem(key)
  return value ? JSON.parse(value) : null
}

export const setUserToken = (token: string): void => {
  set(LOCAL_STORAGE_KEYS.USER_TOKEN, token)
}

export const getUserToken = (): string | null => {
  return localStorage.getItem(LOCAL_STORAGE_KEYS.USER_TOKEN)
}

export const removeUserToken = (): void => {
  localStorage.removeItem(LOCAL_STORAGE_KEYS.USER_TOKEN)
}

export const localStorageService = {
  set,
  get,
  setUserToken,
  getUserToken,
  removeUserToken,
}
