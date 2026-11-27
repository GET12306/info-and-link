import { ArrowRight } from "lucide-react"
import { Link } from "react-router-dom"
import { TRANSLATIONS } from "../i18n"
import type { Language } from "../types"
import type { findNextActivity } from "../utils/nextActivity"
import { dateTimeForViewer } from "../utils/timeZone"

export default function NextActivity({ next, lang }: {
  next: ReturnType<typeof findNextActivity>
  lang: Language
}) {
  const t = TRANSLATIONS[lang]
  const { activity, occurrence } = next ?? {}
  const dateTime = occurrence
    ? occurrence.allDay ? occurrence.date : dateTimeForViewer(occurrence.startInstant)
    : undefined
  return (
    <section className="flex min-w-0 flex-col items-start gap-1 border-t grid-line pt-4 sm:flex-row sm:gap-4">
      <h2 className="shrink-0 text-xs font-bold uppercase leading-6 tracking-widest text-coco-accent">{t.next_activity}</h2>
      {activity && occurrence && dateTime ? (
        <div className="flex min-w-0 max-w-full flex-wrap items-baseline gap-x-3 gap-y-0.5 text-sm leading-6 text-coco-ink/65">
          <time dateTime={dateTime} className="tabular-nums">{dateTime.replace("T", " · ")}</time>
          <Link to="/activities" state={{ activityId: activity.id }}
            className="inline-flex min-w-0 max-w-full items-center gap-1.5 rounded-sm transition-colors hover:text-coco-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-coco-accent">
            <span className="min-w-0 break-words">{activity.title[lang]}</span>
            <ArrowRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          </Link>
        </div>
      ) : <p className="text-xs leading-6 text-coco-ink/60">{t.next_activity_empty}</p>}
    </section>
  )
}
