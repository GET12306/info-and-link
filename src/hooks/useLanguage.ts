import { useEffect, useState } from "react"
import type { Language } from "../types"

const LANGUAGE_STORAGE_KEY = "language"

function getInitialLanguage(): Language {
  if (typeof window === "undefined") return "en"

  let saved: string | null = null
  try {
    saved = window.localStorage.getItem(LANGUAGE_STORAGE_KEY)
  } catch {
    // Browser storage may be unavailable; fall back to the browser preference.
  }
  if (saved === "ja" || saved === "en") return saved

  const preferred = window.navigator.languages?.[0] ?? window.navigator.language
  return preferred.toLowerCase().startsWith("ja") ? "ja" : "en"
}

export function useLanguage(): [Language, () => void] {
  const [language, setLanguage] = useState<Language>(getInitialLanguage)

  useEffect(() => {
    document.documentElement.lang = language
  }, [language])

  const toggleLanguage = () => {
    setLanguage((current) => {
      const next = current === "ja" ? "en" : "ja"
      try {
        window.localStorage.setItem(LANGUAGE_STORAGE_KEY, next)
      } catch {
        // The in-memory choice still applies when browser storage is unavailable.
      }
      return next
    })
  }

  return [language, toggleLanguage]
}
