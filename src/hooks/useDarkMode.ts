import { useState, useEffect } from "react"

export type Theme = "light" | "dark" | "system"

export function useTheme(): [Theme, (t: Theme) => void, boolean] {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") return "system"
    const saved = localStorage.getItem("theme")
    if (saved === "light" || saved === "dark" || saved === "system") return saved
    return "system"
  })

  const [systemDark, setSystemDark] = useState(() => {
    if (typeof window === "undefined") return false
    return window.matchMedia("(prefers-color-scheme: dark)").matches
  })

  useEffect(() => {
    if (theme !== "system") return
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [theme])

  const isDark = theme === "system" ? systemDark : theme === "dark"

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark)
  }, [isDark])

  const setTheme = (t: Theme) => {
    setThemeState(t)
    localStorage.setItem("theme", t)
  }

  return [theme, setTheme, isDark]
}
