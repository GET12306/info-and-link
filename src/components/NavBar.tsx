import { useState, useEffect } from "react"
import { NavLink, Link } from "react-router-dom"
import { AnimatePresence, motion } from "motion/react"
import { ChevronDown, Sun, Moon, Menu, X } from "lucide-react"
import { TRANSLATIONS } from "../i18n"
import type { Theme } from "../hooks/useDarkMode"
import type { Language } from "../types"

type TranslationKey = keyof typeof TRANSLATIONS["en"]

const primaryTabs = [
  { id: "home", path: "/", labelKey: "home" as const },
  { id: "activities", path: "/activities", labelKey: "activities" as const },
  { id: "ticket_info", path: "/tickets", labelKey: "ticket_info" as const },
]

const moreLinks = [
  { id: "profile", labelKey: "about" as const },
  { id: "roles", labelKey: "roles" as const },
  { id: "resources", labelKey: "resources" as const },
  { id: "fan_projects", labelKey: "fan_projects" as const },
]

const themeOptions: { value: Theme; labelKey: TranslationKey }[] = [
  { value: "system", labelKey: "theme_system" },
  { value: "light", labelKey: "theme_light" },
  { value: "dark", labelKey: "theme_dark" },
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
  const [moreOpen, setMoreOpen] = useState(false)

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

  const close = () => {
    setOpen(false)
    setMoreOpen(false)
  }

  return (
    <>
      <nav className="fixed top-0 w-full z-50 border-b grid-line bg-coco-bg/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 md:px-12 h-20 flex items-center justify-between">
          <Link
            to="/"
            className="font-serif text-2xl tracking-tight hover:opacity-80 transition-opacity"
          >
            <span className="text-coco-accent">COCO</span>
          </Link>

          <div className="hidden lg:flex items-center gap-2 lg:gap-8 bg-coco-black/5 p-1 rounded-full border grid-line dark:bg-white/10">
            {primaryTabs.map((tab) => (
              <NavLink
                key={tab.id}
                to={tab.path}
                end={tab.path === "/"}
                className={({ isActive }) =>
                  `px-4 lg:px-6 py-1.5 rounded-full text-[10px] lg:text-xs font-bold uppercase tracking-widest transition-all ${isActive
                    ? "bg-coco-accent text-white"
                    : "text-coco-ink/40 hover:text-coco-ink"
                  }`
                }
              >
                {t[tab.labelKey]}
              </NavLink>
            ))}
            <div className="relative group">
              <button
                className="flex items-center gap-1 px-4 lg:px-6 py-1.5 rounded-full text-[10px] lg:text-xs font-bold uppercase tracking-widest text-coco-ink/40 transition-all hover:text-coco-ink"
                aria-haspopup="true"
              >
                {t.more}
                <ChevronDown className="w-3 h-3 transition-transform group-hover:rotate-180" />
              </button>
              <div className="invisible absolute left-1/2 top-full z-50 w-56 -translate-x-1/2 pt-3 opacity-0 transition-all duration-150 group-hover:visible group-hover:opacity-100">
                <div className="rounded-lg border grid-line bg-coco-bg/95 p-2 shadow-xl backdrop-blur-md">
                  {moreLinks.map((item) => (
                    <a
                      key={item.id}
                      href="#"
                      onClick={(e) => e.preventDefault()}
                      className="block rounded px-4 py-3 text-xs font-bold uppercase tracking-widest text-coco-ink/55 transition-colors hover:bg-coco-accent/5 hover:text-coco-accent"
                    >
                      {t[item.labelKey]}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-2">
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
            className="lg:hidden p-2 -mr-2 rounded hover:bg-coco-accent/10 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-black/40"
              onClick={close}
            />

            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
              className="fixed top-0 right-0 w-full max-w-sm h-full bg-coco-bg dark:bg-neutral-900 shadow-xl p-6 flex flex-col overflow-y-auto"
            >
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
                {primaryTabs.map((tab) => (
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
                <div>
                  <button
                    onClick={() => setMoreOpen((value) => !value)}
                    className="flex w-full items-center justify-between px-4 py-3 rounded text-sm font-bold uppercase tracking-widest text-coco-ink/60 transition-all hover:text-coco-ink hover:bg-coco-accent/5"
                    aria-expanded={moreOpen}
                  >
                    {t.more}
                    <ChevronDown className={`w-4 h-4 transition-transform ${moreOpen ? "rotate-180" : ""}`} />
                  </button>
                  <AnimatePresence initial={false}>
                    {moreOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="ml-4 mt-1 border-l grid-line pl-3">
                          {moreLinks.map((item) => (
                            <a
                              key={item.id}
                              href="#"
                              onClick={(e) => e.preventDefault()}
                              className="block rounded px-4 py-3 text-xs font-bold uppercase tracking-widest text-coco-ink/45 transition-all hover:text-coco-accent hover:bg-coco-accent/5"
                            >
                              {t[item.labelKey]}
                            </a>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </nav>

              <hr className="my-6 border-coco-ink/10" />

              <div>
                <div className="text-[10px] uppercase tracking-widest font-bold opacity-40 mb-3">
                  {lang === "ja" ? "外観" : "Appearance"}
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
                      {t[opt.labelKey]}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
