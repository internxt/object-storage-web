export const LOCAL_STORAGE_KEYS = {
  USER_TOKEN: 'userToken',
}

export const setUserToken = (token: string): void => {
  localStorage.setItem(LOCAL_STORAGE_KEYS.USER_TOKEN, token)
}

export const getUserToken = (): string | null => {
  return localStorage.getItem(LOCAL_STORAGE_KEYS.USER_TOKEN)
}

export const removeUserToken = (): void => {
  localStorage.removeItem(LOCAL_STORAGE_KEYS.USER_TOKEN)
}

export const localStorageService = {
  setUserToken,
  getUserToken,
  removeUserToken,
}
