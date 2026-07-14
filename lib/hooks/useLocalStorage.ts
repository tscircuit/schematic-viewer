import { useCallback } from "react"

export const STORAGE_KEYS = {
  IS_SHOWING_SCHEMATIC_GROUPS: "schematic_viewer_show_groups",
  SELECTED_SCHEMATIC_SHEET: "schematic_viewer_selected_sheet",
} as const

export const getStoredBoolean = (
  key: string,
  defaultValue: boolean,
): boolean => {
  if (typeof window === "undefined") return defaultValue
  try {
    const stored = localStorage.getItem(key)
    return stored !== null ? JSON.parse(stored) : defaultValue
  } catch {
    return defaultValue
  }
}

export const setStoredBoolean = (key: string, value: boolean): void => {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {}
}

export const getStoredString = (key: string): string | null => {
  if (typeof window === "undefined") return null
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

export const setStoredString = (key: string, value: string): void => {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(key, value)
  } catch {}
}

export const useLocalStorage = () => {
  const getBoolean = useCallback(
    (key: string, defaultValue: boolean): boolean => {
      return getStoredBoolean(key, defaultValue)
    },
    [],
  )

  const setBoolean = useCallback((key: string, value: boolean): void => {
    setStoredBoolean(key, value)
  }, [])

  return {
    getBoolean,
    setBoolean,
  }
}

export const useLocalStorageValue = (key: string, defaultValue: boolean) => {
  const { getBoolean, setBoolean } = useLocalStorage()

  const getValue = useCallback(() => {
    return getBoolean(key, defaultValue)
  }, [getBoolean, key, defaultValue])

  const setValue = useCallback(
    (value: boolean) => {
      setBoolean(key, value)
    },
    [setBoolean, key],
  )

  return {
    getValue,
    setValue,
  }
}

let spacePanHeld = false
export const isSpacePanHeld = () => spacePanHeld
export const setSpacePanHeld = (held: boolean) => {
  spacePanHeld = held
}