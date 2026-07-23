import { Ticket } from "lucide-react"
import type { Language } from "../types"
import type { TicketActivityGroup } from "../utils/ticketStatus"
import TicketEntryRow from "./TicketEntryRow"

export default function TicketGroup({
  group,
  lang,
  variant,
  highlighted = false,
}: {
  group: TicketActivityGroup
  lang: Language
  variant: "current" | "past"
  highlighted?: boolean
}) {
  const { activity, entries } = group
  const isCurrent = variant === "current"

  return (
    <section
      id={isCurrent ? `ticket-${activity.originalIndex}` : undefined}
      className={`space-y-4 ${
        isCurrent
          ? `scroll-mt-28 -mx-4 rounded-lg border-l-2 px-4 py-4 transition-all duration-500 ${
              highlighted
                ? "border-l-coco-accent/70 bg-coco-accent/5 dark:bg-coco-accent/10"
                : "border-l-transparent"
            }`
          : ""
      }`}
    >
      <div className="flex items-center gap-3 text-coco-accent">
        <Ticket className="h-4 w-4" aria-hidden="true" />
        <h2 className="text-2xl font-serif">{activity.title[lang]}</h2>
      </div>
      {activity.ticketInfo?.venue && (
        <p className="text-sm text-coco-ink/50">{activity.ticketInfo.venue[lang]}</p>
      )}

      <div className="divide-y divide-gray-300 border-t grid-line dark:divide-white/10">
        {entries.map(({ entry, entryIndex, status }) => {
          const href = entry.link ?? activity.ticketInfo?.officialUrl ?? activity.link

          return isCurrent ? (
            <TicketEntryRow
              key={entryIndex}
              entry={entry}
              lang={lang}
              href={href}
              variant="current"
              status={status}
            />
          ) : (
            <TicketEntryRow
              key={entryIndex}
              entry={entry}
              lang={lang}
              href={href}
              variant="past"
            />
          )
        })}
      </div>
    </section>
  )
}
