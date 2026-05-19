import { useState, lazy, Suspense } from "react"
import { HashRouter, Routes, Route, NavLink, useLocation } from "react-router-dom"
import { motion, AnimatePresence } from "motion/react"
import { Globe, Sun, Moon } from "lucide-react"
import { TRANSLATIONS } from "./i18n"
import { useTheme, type Theme } from "./hooks/useDarkMode"
import type { Language } from "./types"
import Loading from "./components/Loading"

const Home = lazy(() => import("./pages/Home"))
const Activities = lazy(() => import("./pages/Activities"))
const FanProjects = lazy(() => import("./pages/FanProjects"))
const About = lazy(() => import("./pages/About"))

const MonoNumbers = ({ text }: { text: string }) => {
  const parts = text.split(/(\d+)/)
  return (
    <>
      {parts.map((part, i) =>
        /\d+/.test(part) ? (
          <span key={i} className="font-mono tabular-nums">{part}</span>
        ) : (
          part
        )
      )}
    </>
  )
}

const tabs = [
  { id: "home", path: "/", labelKey: "home" },
  { id: "activities", path: "/activities", labelKey: "activities" },
  { id: "fan", path: "/fan", labelKey: "fan_projects" },
  { id: "about_this_web", path: "/about", labelKey: "about_this_web" },
] as const

function AnimatedRoutes({ lang }: { lang: Language }) {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait"> {/* wait保证旧页面“走完”新页面再“进来” */}
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.4 }}
        className="flex-1 max-w-4xl min-h-[60vh]"
      >
        <Routes location={location}>
          <Route path="/" element={<Home lang={lang} />} />
          <Route path="/activities" element={<Activities lang={lang} />} />
          <Route path="/fan" element={<FanProjects lang={lang} />} />
          <Route path="/about" element={<About lang={lang} />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  )
}

export default function App() {
  const [lang, setLang] = useState<Language>("ja")
  const [theme, setTheme, isDark] = useTheme()
  const t = TRANSLATIONS[lang]

  return (
    <HashRouter>
      <div className="min-h-screen bg-coco-bg selection:bg-coco-accent/10">
        <nav className="fixed top-0 w-full z-50 border-b grid-line bg-coco-bg/80 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-6 md:px-12 h-20 flex items-center justify-between">
            <div className="font-serif text-2xl tracking-tight hidden lg:block">
              <span className="text-coco-accent">Coco</span> Unofficial Info Hub
            </div>

            <div className="flex items-center gap-2 md:gap-8 bg-coco-black/5 p-1 rounded-full border grid-line dark:bg-white/10">
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

            <span className="flex items-center gap-2">
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
            </span>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-6 md:px-12 py-32 flex flex-col md:flex-row gap-16 relative">
          <Suspense fallback={<Loading />}>
            <AnimatedRoutes lang={lang} />
          </Suspense>
        </main>

        <footer className="border-t grid-line py-12 px-6">
          <div className="max-w-7xl mx-auto flex flex-col items-center gap-6 text-[10px] uppercase tracking-widest opacity-30 font-medium">
            <span className="text-center"><MonoNumbers text="Copyright © 2026 GC Zhu. All Rights Reserved. This site is a fan project and is not affiliated with or endorsed by LIBERTE or Coco Hayashi." /></span>
            <button
              onClick={() => setLang(lang === "ja" ? "en" : "ja")}
              className="self-end flex items-center gap-2 px-3 py-1.5 border grid-line rounded hover:border-coco-accent transition-all"
            >
              <Globe className="w-3 h-3" />
              {lang === "ja" ? "English" : "日本語"}
            </button>
          </div>
        </footer>
      </div>
    </HashRouter>
  )
}
