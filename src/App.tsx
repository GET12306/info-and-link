import { lazy, Suspense, useEffect } from "react"
import { HashRouter, Routes, Route, useLocation, Link } from "react-router-dom"
import { motion, AnimatePresence } from "motion/react"
import { Globe } from "lucide-react"
import { useTheme } from "./hooks/useDarkMode"
import type { Language } from "./types"
import Loading from "./components/Loading"
import NavBar from "./components/NavBar"
import { useLanguage } from "./hooks/useLanguage"
import { pageLoaders, preloadPage } from "./utils/pageLoaders"

const DailyPosts = lazy(pageLoaders.dailyPosts)
const ArchivedAccounts = lazy(pageLoaders.archivedAccounts)
const Museum = lazy(pageLoaders.museum)
const Credits = lazy(pageLoaders.credits)
const Programs = lazy(pageLoaders.programs)
const Media = lazy(pageLoaders.media)
const Home = lazy(pageLoaders.home)
const Activities = lazy(pageLoaders.activities)
const PastActivities = lazy(pageLoaders.pastActivities)
const TicketInfo = lazy(pageLoaders.tickets)
const About = lazy(pageLoaders.about)
const VenueDetails = lazy(pageLoaders.venueDetails)

function AnimatedRoutes({ lang }: { lang: Language }) {
  const location = useLocation()
  const isHome = location.pathname === "/"
  const isCatalog = location.pathname.startsWith("/museum/")
  useEffect(() => {
    // AnimatePresence keeps the old page mounted for its 0.4s exit; load the target in parallel.
    void preloadPage(location.pathname)
  }, [location.pathname])
  return (
    <main className="relative w-full py-32">
      <Suspense fallback={<Loading />}>
        <AnimatePresence mode="wait"> {/* wait保证旧页面“走完”新页面再“进来” */}
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            className={`min-h-[60vh] min-w-0 ${
              isHome ? "home-container" : "mx-auto w-full max-w-7xl px-6 md:px-12"
            }`}
          >
            <div className={isHome || isCatalog ? "w-full" : "max-w-4xl"}>
              <Routes location={location}>
                <Route path="/" element={<Home lang={lang} />} />
                <Route path="/activities" element={<Activities lang={lang} />} />
                <Route path="/venues/:venueId" element={<VenueDetails lang={lang} />} />
                <Route path="/museum/activities" element={<PastActivities lang={lang} />} />
                <Route path="/tickets" element={<TicketInfo lang={lang} />} />
                <Route path="/museum" element={<Museum lang={lang} />} />
                <Route path="/museum/credits" element={<Credits lang={lang} />} />
                <Route path="/museum/programs" element={<Programs lang={lang} />} />
                <Route path="/museum/daily-posts" element={<DailyPosts lang={lang} />} />
                <Route path="/museum/accounts" element={<ArchivedAccounts lang={lang} />} />
                <Route path="/museum/media" element={<Media lang={lang} />} />
                <Route path="/about" element={<About lang={lang} />} />
              </Routes>
            </div>
          </motion.div>
        </AnimatePresence>
      </Suspense>
    </main>
  )
}

export default function App() {
  const [lang, toggleLanguage] = useLanguage()
  const [theme, setTheme, isDark] = useTheme()

  return (
    <HashRouter>
      <div className="min-h-screen bg-coco-bg selection:bg-coco-accent/10">
        <NavBar
          lang={lang}
          theme={theme}
          setTheme={setTheme}
          isDark={isDark}
        />

        <AnimatedRoutes lang={lang} />

        <footer className="border-t grid-line py-12 px-6">
          <div className="max-w-7xl mx-auto flex flex-col items-center gap-6 text-[10px] uppercase tracking-widest font-medium text-coco-ink/30">
            <div className="flex flex-col items-center gap-3 text-center">
              <span>Copyright © 2026 GC Zhu. All Rights Reserved. This site is a fan project and is not affiliated with or endorsed by LIBERTE or Coco Hayashi.</span>
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
                <a
                  href="https://coco-hearth.hayashicoco.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-coco-ink/45 hover:text-coco-accent transition-colors"
                >
                  {lang === "ja" ? "ひみつの場所" : "Secret Garden"}
                </a>
                <span aria-hidden="true" className="text-coco-ink/15">|</span>
                <Link
                  to="/about"
                  className="text-coco-ink/45 hover:text-coco-accent transition-colors"
                >
                  {lang === "ja" ? "このサイトについて / 情報提供" : "About this site / How to contribute"}
                </Link>
              </div>
            </div>
            <button
              onClick={toggleLanguage}
              className="self-end flex items-center gap-2 rounded-full border grid-line px-3 py-1.5 transition-all hover:border-coco-accent"
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
