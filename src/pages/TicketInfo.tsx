import { useEffect, useState } from "react"
import { motion } from "motion/react"
import { ArrowRight, ExternalLink } from "lucide-react"
import { Link, useLocation } from "react-router-dom"
import { TRANSLATIONS } from "../i18n"
import ACTIVITIES from "../data/activities.yaml"
import type { Activity, Language } from "../types"
import { getCurrentTicketGroups, getPastTicketGroups } from "../utils/ticketStatus"

const statusClassNames = {
  upcoming: "bg-coco-accent/10 text-coco-accent",
  open: "bg-coco-accent text-white",
  past: "bg-coco-ink/10 text-coco-ink/50 dark:bg-white/10",
  tba: "bg-coco-ink/5 text-coco-ink/50 dark:bg-white/10",
}

export default function TicketInfo({ lang }: { lang: Language }) {
  const t = TRANSLATIONS[lang]
  const location = useLocation()
  const [highlighted, setHighlighted] = useState<number | null>(null)
  const activities = ACTIVITIES as Activity[]
  const ticketGroups = getCurrentTicketGroups(activities)
  const pastTicketGroups = getPastTicketGroups(activities)

  useEffect(() => {
    const scrollToTicket = (location.state as { scrollToTicket?: number })?.scrollToTicket
    if (scrollToTicket === undefined) return

    requestAnimationFrame(() => {
      const el = document.getElementById(`ticket-${scrollToTicket}`)
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" })
        setHighlighted(scrollToTicket)
        setTimeout(() => setHighlighted(null), 2000)
      }
    })
  }, [location.state])

  return (
    <motion.div
      key="ticket-info"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4 }}
      className="space-y-20 pb-32"
    >
      <div className="border-b grid-line pb-12">
        <h1 className="text-5xl md:text-7xl font-serif mb-4">{t.ticket_info}</h1>
        <p className="text-coco-ink/50 uppercase tracking-widest text-xs">Ticket Schedule & Prices</p>
      </div>

      {ticketGroups.length > 0 ? (
        <div className="space-y-12">
          {ticketGroups.map(({ activity, entries }) => (
            <section
              key={activity.originalIndex}
              id={`ticket-${activity.originalIndex}`}
              className={`scroll-mt-28 -mx-4 space-y-4 rounded-lg border-l-2 px-4 py-4 transition-all duration-500 ${
                highlighted === activity.originalIndex
                  ? "border-coco-accent/70 bg-coco-accent/5 dark:bg-coco-accent/10"
                  : "border-transparent"
              }`}
            >
              <div className="flex items-center gap-3 text-coco-accent">
                <h2 className="text-2xl font-serif">{activity.title[lang]}</h2>
              </div>
              {activity.ticketInfo?.venue && (
                <p className="text-sm text-coco-ink/50">{activity.ticketInfo.venue[lang]}</p>
              )}

              <div className="border-t grid-line divide-y divide-gray-300 dark:divide-white/10">
                {entries.map(({ entry, entryIndex, status }) => (
                  <div key={entryIndex} className="py-5 flex flex-col md:flex-row md:items-start gap-4">
                    <div className="md:w-32">
                      <span className={`inline-flex px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest ${statusClassNames[status]}`}>
                        {t[`ticket_status_${status}`]}
                      </span>
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="text-xl font-serif">{entry.type[lang]}</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div>
                          <div className="text-[10px] uppercase tracking-widest text-coco-ink/40 mb-1">{t.ticket_period}</div>
                          <div className="text-coco-ink/70">{entry.period[lang]}</div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase tracking-widest text-coco-ink/40 mb-1">{t.ticket_price}</div>
                          <div className="text-coco-ink/70">{entry.price[lang]}</div>
                        </div>
                      </div>
                      {entry.note && (
                        <p className="text-sm text-coco-ink/50">{entry.note[lang]}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <a
                href={activity.ticketInfo?.officialUrl ?? activity.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-coco-accent hover:opacity-70 transition-opacity"
              >
                {t.ticket_official_info}
                <ExternalLink className="w-3 h-3" />
              </a>
            </section>
          ))}

          {pastTicketGroups.length > 0 && (
          <div className="border-t grid-line pt-6">
            <Link
              to="/tickets/past"
              className="group flex items-center justify-between gap-4 py-6 hover:opacity-80 transition-opacity"
            >
              <div className="md:w-32 font-mono text-sm text-coco-ink/40">Archive</div>
              <div className="flex-1">
                <div className="text-xl font-serif mb-1">{t.view_past_tickets}</div>
                <div className="text-sm text-coco-ink/60">{t.view_past_tickets_description}</div>
              </div>
              <ArrowRight className="w-4 h-4 text-coco-accent opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
            </Link>
          </div>
          )}
        </div>
      ) : (
        <div className="py-20 text-center border grid-line bg-white/50 dark:bg-neutral-900/50">
          <p className="text-coco-ink/30 font-serif text-3xl">{t.no_ticket_info}</p>
        </div>
      )}
    </motion.div>
  )
}
