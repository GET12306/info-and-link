import { Tickets } from "lucide-react"
import { Link } from "react-router-dom"
import type { Language } from "../types"
import type { IndexedActivity } from "../utils/activityStatus"
import ExternalAnchor from "./ExternalAnchor"

export default function ActivityRow({
  activity,
  lang,
  categoryLabel,
  highlighted,
  ticketAction,
}: {
  activity: IndexedActivity
  lang: Language
  categoryLabel?: string
  highlighted?: boolean
  ticketAction?: {
    label: string
    to: string
    state: { scrollToTicket: number }
  }
}) {
  const supportsHighlight = highlighted !== undefined

  return (
    <article
      id={supportsHighlight ? `event-${activity.originalIndex}` : undefined}
      className={`flex flex-col justify-between gap-4 py-6 md:flex-row md:items-start ${
        supportsHighlight
          ? `scroll-mt-28 rounded-lg border-l-2 px-4 transition-all duration-500 ${
              highlighted
                ? "border-l-coco-accent/70 bg-coco-accent/5 dark:bg-coco-accent/10"
                : "border-l-transparent"
            }`
          : ""
      }`}
    >
      <div className="font-mono text-sm text-coco-ink/40 md:w-32">{activity.date}</div>
      <div className="flex flex-1 flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="flex-1">
          {categoryLabel && (
            <div className="mb-1 text-[10px] uppercase tracking-widest text-coco-ink/40">
              {categoryLabel}
            </div>
          )}
          <ExternalAnchor
            href={activity.link}
            className="inline-block text-xl font-serif leading-relaxed transition-colors hover:text-coco-accent"
          >
            {activity.title[lang]}
          </ExternalAnchor>
          {activity.description && (
            <div className="text-sm text-coco-ink/60">{activity.description[lang]}</div>
          )}
        </div>

        {ticketAction && (
          <Link
            to={ticketAction.to}
            state={ticketAction.state}
            className="inline-flex shrink-0 items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-coco-accent transition-opacity hover:opacity-70"
          >
            <Tickets className="h-3.5 w-3.5" aria-hidden="true" />
            {ticketAction.label}
          </Link>
        )}
      </div>
    </article>
  )
}
