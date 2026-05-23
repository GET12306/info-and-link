import { useState, useEffect } from "react"
import { NavLink, Link } from "react-router-dom"
import { Sun, Moon, Menu, X } from "lucide-react"
import { TRANSLATIONS } from "../i18n"
import type { Theme } from "../hooks/useDarkMode"
import type { Language } from "../types"

const tabs = [
  { id: "home", path: "/", labelKey: "home" as const },
  { id: "activities", path: "/activities", labelKey: "activities" as const },
  { id: "fan", path: "/fan", labelKey: "fan_projects" as const },
  { id: "about_this_web", path: "/about", labelKey: "about_this_web" as const },
]

const themeOptions: { value: Theme; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
]

export default function NavBar({
  lang,
  theme,
  setTheme,
  isDark,
}: {
  lang: Language
  theme: Theme
  setTheme: (t: Theme) => void
  isDark: boolean
}) {
  const t = TRANSLATIONS[lang]
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open])

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [open])

  const close = () => setOpen(false)

  return (
    <>
      <nav className="fixed top-0 w-full z-50 border-b grid-line bg-coco-bg/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 md:px-12 h-20 flex items-center justify-between">
          <Link
            to="/"
            className="font-serif text-2xl tracking-tight hover:opacity-80 transition-opacity"
          >
            <span className="text-coco-accent">Coco</span> Unofficial Info Hub
          </Link>

          <div className="hidden md:flex items-center gap-2 md:gap-8 bg-coco-black/5 p-1 rounded-full border grid-line dark:bg-white/10">
            {tabs.map((tab) => (
              <NavLink
                key={tab.id}
                to={tab.path}
                end={tab.path === "/"}
                className={({ isActive }) =>
                  `px-4 md:px-6 py-1.5 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all ${isActive
                    ? "bg-coco-accent text-white"
                    : "text-coco-ink/40 hover:text-coco-ink"
                  }`
                }
              >
                {t[tab.labelKey]}
              </NavLink>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-2">
            {isDark ? <Moon className="w-3 h-3" /> : <Sun className="w-3 h-3" />}
            <select
              value={theme}
              onChange={e => setTheme(e.target.value as Theme)}
              className="px-2 py-1 border grid-line rounded bg-transparent text-[10px] font-bold uppercase tracking-wider cursor-pointer hover:border-coco-accent transition-all outline-none"
            >
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>

          <button
            onClick={() => setOpen(true)}
            className="md:hidden p-2 -mr-2 rounded hover:bg-coco-accent/10 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </nav>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black/40" onClick={close} />

          <div className="fixed top-0 right-0 w-full max-w-sm h-full bg-coco-bg dark:bg-neutral-900 shadow-xl p-6 flex flex-col overflow-y-auto">
            <div className="flex justify-end">
              <button
                onClick={close}
                className="p-2 -mr-2 rounded hover:bg-coco-accent/10 transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex flex-col gap-1 mt-8">
              {tabs.map((tab) => (
                <NavLink
                  key={tab.id}
                  to={tab.path}
                  end={tab.path === "/"}
                  onClick={close}
                  className={({ isActive }) =>
                    `px-4 py-3 rounded text-sm font-bold uppercase tracking-widest transition-all ${isActive
                      ? "bg-coco-accent text-white"
                      : "text-coco-ink/60 hover:text-coco-ink hover:bg-coco-accent/5"
                    }`
                  }
                >
                  {t[tab.labelKey]}
                </NavLink>
              ))}
            </nav>

            <hr className="my-6 border-coco-ink/10" />

            <div>
              <div className="text-[10px] uppercase tracking-widest font-bold opacity-40 mb-3">
                Appearance
              </div>
              <div className="flex gap-2">
                {themeOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setTheme(opt.value)}
                    className={`flex-1 px-3 py-2 rounded text-[10px] font-bold uppercase tracking-wider transition-all ${
                      theme === opt.value
                        ? "bg-coco-accent text-white"
                        : "border grid-line text-coco-ink/60 hover:text-coco-ink"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
