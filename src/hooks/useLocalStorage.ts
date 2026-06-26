import { useEffect, useState } from 'react'

/**
 * Custom hook for persisting state in localStorage.
 * @template T - The type of the stored value.
 * @param {string} key - The localStorage key.
 * @param {T} initialValue - Default value if nothing is stored yet.
 * @returns {[T, (value: T) => void]} Current value and setter, mirrors useState.
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key)
      return stored !== null ? (JSON.parse(stored) as T) : initialValue
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // ignore write errors (e.g. storage full, private mode)
    }
  }, [key, value])

  return [value, setValue]
}
