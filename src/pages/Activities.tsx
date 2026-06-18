import { useEffect, useRef, useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { motion } from "motion/react"
import { Music, Ticket, Tv, MicVocal, BookOpenText, ArrowRight, Tickets } from "lucide-react"
import { TRANSLATIONS } from "../i18n"
import ACTIVITIES from "../data/activities.yaml"
import type { Activity, Language } from "../types"
import { getCurrentActivities, getPastActivities } from "../utils/activityStatus"
import { hasCurrentTicketInfo } from "../utils/ticketStatus"

export default function Activities({ lang }: { lang: Language }) {
  const t = TRANSLATIONS[lang]
  const location = useLocation()
  const listRef = useRef<HTMLDivElement>(null)
  const [highlighted, setHighlighted] = useState<number | null>(null)
  const activities = ACTIVITIES as Activity[]
  const currentActivities = getCurrentActivities(activities)
  const pastActivities = getPastActivities(activities)

  useEffect(() => {
    const scrollTo = (location.state as { scrollTo?: number })?.scrollTo
    if (scrollTo === undefined) return
    requestAnimationFrame(() => {
      const el = document.getElementById(`event-${scrollTo}`)
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" })
        setHighlighted(scrollTo)
        setTimeout(() => setHighlighted(null), 2000)
      }
    })
  }, [location.state])

  const categories = [
    { id: "Live", name: t.category_live },
    { id: "Musical", name: t.category_musical },
    { id: "Stage", name: t.category_stage },
    { id: "Reading", name: t.category_reading },
    { id: "Program", name: t.category_program },
  ]

  return (
    <motion.div
      key="activities"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4 }}
      className="space-y-20 pb-32"
    >
      <div className="border-b grid-line pb-12">
        <h1 className="text-5xl md:text-7xl font-serif mb-4">{t.activities}</h1>
        <p className="text-coco-ink/50 uppercase tracking-widest text-xs">Performance History & Schedule</p>
      </div>

      {/* Event List */}
      <div ref={listRef} className="space-y-18">
        {categories.map((cat) => {
          const categoryActivities = currentActivities.filter((a) => a.category === cat.id)
          if (categoryActivities.length === 0) return null

          return (
            <div key={cat.id} className="space-y-8">
              <h3 className="text-[15px] uppercase tracking-[0.3em] font-bold text-coco-accent flex items-center gap-3">
                {cat.id === "Musical" && <Music className="w-4 h-4" />}
                {cat.id === "Stage" && <Ticket className="w-4 h-4" />}
                {cat.id === "Program" && <Tv className="w-4 h-4" />}
                {cat.id === "Live" && <MicVocal className="w-4 h-4" />}
                {cat.id === "Reading" && <BookOpenText className="w-4 h-4" />}
                {cat.name}
              </h3>
              <div className="border-t grid-line divide-y divide-gray-300 dark:divide-white/10">
                {categoryActivities.map((act) => (
                  <div
                    key={act.originalIndex}
                    id={`event-${act.originalIndex}`}
                    className={`rounded-lg border-l-2 px-4 py-6 flex flex-col md:flex-row md:items-start justify-between gap-4 transition-all duration-500 ${
                      highlighted === act.originalIndex
                        ? "border-coco-accent/70 bg-coco-accent/5 dark:bg-coco-accent/10"
                        : "border-transparent"
                    }`}
                  >
                    <div className="md:w-32 font-mono text-sm text-coco-ink/40">{act.date}</div>
                    <div className="flex-1 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <a href={act.link} target="_blank" rel="noopener noreferrer" className="flex-1 hover:opacity-80 transition-opacity">
                        <div className="text-xl font-serif mb-1">{act.title[lang]}</div>
                        {act.description && (
                          <div className="text-sm text-coco-ink/60">{act.description[lang]}</div>
                        )}
                      </a>
                      {hasCurrentTicketInfo(act) && (
                        <Link
                          to="/tickets"
                          state={{ scrollToTicket: act.originalIndex }}
                          className="inline-flex shrink-0 items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-coco-accent hover:opacity-70 transition-opacity"
                        >
                          <Tickets className="w-3.5 h-3.5" />
                          {t.ticket_info}
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {pastActivities.length > 0 && (
        <div className="border-t grid-line pt-6">
          <Link
            to="/activities/past"
            className="group flex items-center justify-between gap-4 py-6 hover:opacity-80 transition-opacity"
          >
            <div className="md:w-32 font-mono text-sm text-coco-ink/40">
              Archive
            </div>
            <div className="flex-1">
              <div className="text-xl font-serif mb-1">{t.view_past_activities}</div>
              <div className="text-sm text-coco-ink/60">{t.view_past_activities_description}</div>
            </div>
            <ArrowRight className="w-4 h-4 text-coco-accent opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
          </Link>
        </div>
      )}
    </motion.div>
  )
}
