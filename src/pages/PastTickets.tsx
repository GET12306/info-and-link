import { Link } from "react-router-dom"
import { motion } from "motion/react"
import { ArrowLeft, Ticket } from "lucide-react"
import { TRANSLATIONS } from "../i18n"
import ACTIVITIES from "../data/activities.yaml"
import type { Activity, Language } from "../types"
import { getPastTicketGroups } from "../utils/ticketStatus"

export default function PastTickets({ lang }: { lang: Language }) {
  const t = TRANSLATIONS[lang]
  const ticketGroups = getPastTicketGroups(ACTIVITIES as Activity[])

  return (
    <motion.div
      key="past-tickets"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4 }}
      className="space-y-20 pb-32"
    >
      <div className="border-b grid-line pb-12 space-y-6">
        <Link
          to="/tickets"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-coco-ink/50 hover:text-coco-accent transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t.back_to_ticket_info}
        </Link>

        <div>
          <h1 className="text-5xl md:text-7xl font-serif mb-4">{t.past_tickets}</h1>
          <p className="text-coco-ink/50 uppercase tracking-widest text-xs">Archived Ticket Information</p>
        </div>
      </div>

      {ticketGroups.length > 0 ? (
        <div className="space-y-12">
          {ticketGroups.map(({ activity, entries }) => (
            <section key={activity.originalIndex} className="space-y-4">
              <div className="flex items-center gap-3 text-coco-accent">
                <Ticket className="w-4 h-4" />
                <h2 className="text-2xl font-serif">{activity.title[lang]}</h2>
              </div>

              <div className="border-t grid-line divide-y divide-gray-300 dark:divide-white/10">
                {entries.map(({ entry, entryIndex }) => {
                  const ticketUrl = entry.link ?? activity.ticketInfo?.officialUrl ?? activity.link

                  return (
                    <div key={entryIndex} className="py-5 flex flex-col md:flex-row md:items-start gap-4">
                      <div className="md:w-32 font-mono text-sm text-coco-ink/40">
                        {entry.endDate ?? entry.period[lang]}
                      </div>
                      <div className="flex-1 space-y-3">
                        <a
                          href={ticketUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block text-xl font-serif leading-relaxed transition-colors hover:text-coco-accent"
                        >
                          {entry.type[lang]}
                        </a>
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
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center border grid-line bg-white/50 dark:bg-neutral-900/50">
          <p className="text-coco-ink/30 font-serif text-3xl">{t.no_past_tickets}</p>
        </div>
      )}
    </motion.div>
  )
}
