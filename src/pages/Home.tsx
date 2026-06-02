import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "motion/react"
import { ExternalLink, ArrowRight, Star, House, Hotel } from "lucide-react"
import { SiX, SiInstagram } from "react-icons/si"
import { TRANSLATIONS } from "../i18n"
import COCO_PROFILE from "../data/profile.yaml"
import OFFICIAL_LINKS from "../data/official-links.yaml"
import RESOURCE_LINKS from "../data/resource-links.yaml"
import ACTIVITIES from "../data/activities.yaml"
import type { Language } from "../types"
import { buildCalendarData, type CalendarDay, type CalendarEvent } from "../hooks/useCalendarEvents"
import CalendarMonth from "../components/CalendarMonth"

interface PopupState {
  day: CalendarDay
  x: number
  y: number
  placement: "above" | "below"
}

type FloatingPosition = Pick<PopupState, "x" | "y" | "placement">

const TOOLTIP_WIDTH = 280
const DETAIL_POPUP_WIDTH = 320
const VIEWPORT_GUTTER = 8

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function getFloatingPosition(el: HTMLElement, width: number): FloatingPosition {
  const rect = el.getBoundingClientRect()
  const actualWidth = Math.min(width, window.innerWidth - VIEWPORT_GUTTER * 2)
  const x = clamp(
    rect.left + rect.width / 2 - actualWidth / 2,
    VIEWPORT_GUTTER,
    Math.max(VIEWPORT_GUTTER, window.innerWidth - actualWidth - VIEWPORT_GUTTER)
  )
  const placement: FloatingPosition["placement"] = rect.top > window.innerHeight * 0.55 ? "above" : "below"
  const y = placement === "above" ? rect.top - 8 : rect.bottom + 8
  return { x, y, placement }
}

function getAvailableFloatingHeight(pos: FloatingPosition) {
  if (typeof window === "undefined") return "70vh"
  const available = pos.placement === "above"
    ? pos.y - VIEWPORT_GUTTER
    : window.innerHeight - pos.y - VIEWPORT_GUTTER
  return `${Math.max(80, available)}px`
}

// const MonoNumbers = ({ text }: { text: string }) => {
//   const parts = text.split(/(\d+)/)
//   return (
//     <>
//       {parts.map((part, i) =>
//         /\d+/.test(part) ? (
//           <span key={i} className="font-mono tabular-nums">{part}</span>
//         ) : (
//           part
//         )
//       )}
//     </>
//   )
// }

export default function Home({ lang }: { lang: Language }) {
  const t = TRANSLATIONS[lang]
  const navigate = useNavigate()

  const months = buildCalendarData(ACTIVITIES as any[])
  const today = (() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
  })()

  const [monthIndex, setMonthIndex] = useState(() => {
    const now = new Date()
    const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
    const idx = months.findIndex(m => m.key === todayKey)
    return idx >= 0 ? idx : months.findIndex(m => m.key >= todayKey) >= 0 ? months.findIndex(m => m.key >= todayKey) : 0
  })

  const [hoveredDay, setHoveredDay] = useState<string | null>(null)
  const [hoveredContent, setHoveredContent] = useState<{ title: string; category: string }[]>([])
  const [tooltipPos, setTooltipPos] = useState<FloatingPosition>({ x: 0, y: 0, placement: "below" })
  const [popup, setPopup] = useState<PopupState | null>(null)

  useEffect(() => {
    if (!hoveredDay && !popup) return
    const dismiss = () => {
      setHoveredDay(null)
      setHoveredContent([])
      setPopup(null)
    }
    const dismissOnEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss()
    }
    window.addEventListener("scroll", dismiss, true)
    window.addEventListener("wheel", dismiss, { passive: true })
    window.addEventListener("touchmove", dismiss, { passive: true })
    window.addEventListener("keydown", dismissOnEscape)
    return () => {
      window.removeEventListener("scroll", dismiss, true)
      window.removeEventListener("wheel", dismiss)
      window.removeEventListener("touchmove", dismiss)
      window.removeEventListener("keydown", dismissOnEscape)
    }
  }, [hoveredDay, popup])

  const scrollToEvent = (index: number) => {
    navigate("/activities", { state: { scrollTo: index } })
  }

  const handleHoverDay = (date: string, events: CalendarEvent[], el: HTMLElement) => {
    setHoveredDay(date)
    setTooltipPos(getFloatingPosition(el, TOOLTIP_WIDTH))
    setHoveredContent(
      events.map((ev) => ({
        title: (ACTIVITIES as any[])[ev.activityIndex]?.title?.[lang] || "",
        category: (ACTIVITIES as any[])[ev.activityIndex]?.category || "",
      }))
    )
  }

  const handleLeaveDay = () => {
    setHoveredDay(null)
    setHoveredContent([])
  }

  const handlePopup = (nextPopup: PopupState | null) => {
    setHoveredDay(null)
    setHoveredContent([])
    setPopup(nextPopup)
  }

  return (
    <motion.div
      key="home"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4 }}
      className="space-y-32"
    >
      <section>
        <h1 className="text-6xl md:text-8xl mb-8 leading-tight">
          {lang === "ja" ? COCO_PROFILE.name : COCO_PROFILE.romaji}
        </h1>
        <p className="text-xl md:text-2xl text-coco-ink/60 font-serif leading-relaxed max-w-2xl">
          {t.hero_subtitle}
        </p>
      </section>

      <section id="about" className="space-y-12">
        <h2 className="text-[15px] uppercase tracking-[0.3em] font-bold text-coco-accent">{t.about}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-12 gap-x-24 grid-line pt-0">
          {[
            { label: t.born, value: lang === "ja" ? COCO_PROFILE.birthDate : COCO_PROFILE.birthDate_en },
            { label: t.place, value: lang === "ja" ? COCO_PROFILE.birthPlace : COCO_PROFILE.birthPlace_en },
            { label: t.voice_range, value: COCO_PROFILE.voice_range },
            { label: t.agency, value: lang === "ja" ? COCO_PROFILE.agency : COCO_PROFILE.agency_en },
          ].map((item, i) => (
            <div key={i} className="space-y-1">
              <span className="text-[13px] uppercase tracking-widest opacity-40">{item.label}</span>
              <p className="text-xl font-serif">
                {/* <MonoNumbers text={item.value} /> */}
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Calendar Section */}
      {months.length > 0 && (
        <section className="space-y-12">
          <h2 className="text-[15px] uppercase tracking-[0.3em] font-bold text-coco-accent">
            {t["event_calendar"]}
          </h2>
          {months[monthIndex] && (
            <CalendarMonth
              month={months[monthIndex]}
              lang={lang}
              today={today}
              className="max-w-sm"
              hoveredDay={hoveredDay}
              onHoverDay={handleHoverDay}
              onLeaveDay={handleLeaveDay}
              popup={popup}
              onPopup={handlePopup}
              hasPrev={monthIndex > 0}
              hasNext={monthIndex < months.length - 1}
              onPrev={() => setMonthIndex((i) => i - 1)}
              onNext={() => setMonthIndex((i) => i + 1)}
            />
          )}
        </section>
      )}

      {/* Tooltip */}
      {hoveredDay && hoveredContent.length > 0 && (
        <div
          className="fixed z-50 bg-white dark:bg-neutral-800 border grid-line rounded shadow-lg p-3 pointer-events-none max-w-[calc(100vw-1rem)]"
          style={{
            left: tooltipPos.x,
            top: tooltipPos.y,
            width: `min(${TOOLTIP_WIDTH}px, calc(100vw - 1rem))`,
            transform: tooltipPos.placement === "above" ? "translateY(-100%)" : undefined,
          }}
        >
          {hoveredContent.slice(0, 3).map((c, i) => (
            <div key={i} className="text-xs leading-snug">
              <span className="text-[10px] uppercase tracking-wider opacity-40 mr-2">{c.category}</span>
              <span>{c.title}</span>
            </div>
          ))}
          {hoveredContent.length > 3 && (
            <div className="text-[10px] opacity-40 mt-1">+{hoveredContent.length - 3} more</div>
          )}
        </div>
      )}

      {/* Event Popup (multi-event day) */}
      {popup && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setPopup(null)} />

          <motion.div
            initial={{ opacity: 0, y: popup.placement === "above" ? 6 : -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: popup.placement === "above" ? 6 : -6, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            className="fixed z-50 bg-white dark:bg-neutral-800 border grid-line rounded-lg shadow-xl p-4 max-w-[calc(100vw-1rem)] overflow-y-auto"
            style={{
              left: popup.x,
              top: popup.y,
              width: `min(${DETAIL_POPUP_WIDTH}px, calc(100vw - 1rem))`,
              maxHeight: getAvailableFloatingHeight(popup),
              transform: popup.placement === "above" ? "translateY(-100%)" : undefined,
            }}
            role="dialog"
            aria-modal="true"
          >
            <div className="text-[10px] uppercase tracking-widest font-bold text-coco-accent mb-3">
              {popup.day.dayNumber}{lang === "ja" ? "日のイベント" : " events"}
            </div>

            <div className="space-y-3">
              {popup.day.events.map((ev, i) => {
                const act = (ACTIVITIES as any[])[ev.activityIndex]
                return (
                  <div key={i} className="border-b grid-line pb-3 last:border-0 last:pb-0">
                    <div className="text-[10px] opacity-40 uppercase tracking-widest mb-1">{act?.category}</div>
                    <div className="text-sm font-medium leading-snug">{act?.title?.[lang]}</div>
                    {act?.description?.[lang] && (
                      <div className="text-xs text-coco-ink/60 leading-relaxed mt-1">{act.description[lang]}</div>
                    )}
                    <button
                      type="button"
                      onClick={() => { scrollToEvent(ev.activityIndex); setPopup(null) }}
                      className="mt-3 inline-flex items-center gap-1 text-[10px] uppercase tracking-widest font-bold text-coco-accent hover:opacity-70 transition-opacity"
                    >
                      {lang === "ja" ? "活動ページへ" : "View details"}
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                )
              })}
            </div>
          </motion.div>
        </>
      )}

      <section className="space-y-12 pb-24">
        <h2 className="text-[15px] uppercase tracking-[0.3em] font-bold text-coco-accent">{t.links}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {([...(OFFICIAL_LINKS as any[]), ...(RESOURCE_LINKS as any[])]).map((link: any, i: number) => {
            const icons: any = { SiX, SiInstagram, House, Star, Hotel, ExternalLink }
            const Icon = icons[link.icon] || ExternalLink
            return (
              <motion.a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="group flex items-center justify-between p-4 bg-white border grid-line rounded hover:bg-coco-accent/5 hover:border-coco-accent transition-all dark:bg-neutral-900"
              >
                <div className="flex items-center gap-4">
                  <Icon className="w-5 h-5 text-coco-black group-hover:text-coco-accent transition-colors" />
                  <span className="font-medium text-sm md:text-base">{lang === "ja" ? link.platform["ja"] : link.platform["en"]}</span>
                </div>
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0 text-coco-accent" />
              </motion.a>
            )
          })}
        </div>
      </section>
    </motion.div>
  )
}
