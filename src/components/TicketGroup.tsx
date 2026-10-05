import { Ticket } from "lucide-react"
import type { Language } from "../types"
import {
  getTicketEntryLink,
  getTicketEntryPrice,
  type TicketActivityGroup,
} from "../utils/ticketStatus"
import TicketEntryRow from "./TicketEntryRow"
import VenueLabel from "./VenueLabel"

export default function TicketGroup({
  group,
  lang,
  highlighted = false,
}: {
  group: TicketActivityGroup
  lang: Language
  highlighted?: boolean
}) {
  const { activity, entries } = group

  return (
    <section
      id={`ticket-${activity.id}`}
      className={`space-y-4 scroll-mt-28 -mx-4 rounded-lg border-l-2 px-4 py-4 transition-all duration-500 ${
        highlighted ? "border-l-coco-accent/70 bg-coco-accent/5 dark:bg-coco-accent/10" : "border-l-transparent"
      }`}
    >
      <div className="grid grid-cols-1 text-coco-accent sm:grid-cols-[1rem_minmax(0,1fr)] sm:gap-3">
        <span className="hidden h-10 items-center sm:flex" aria-hidden="true">
          <Ticket className="h-4 w-4 shrink-0 translate-y-0.5" />
        </span>
        <h2 className="min-w-0 break-words text-2xl font-serif leading-10">
          {activity.title[lang]}
        </h2>
      </div>
      {(activity.venueIds?.length || activity.venueNote) && (
        <VenueLabel venueIds={activity.venueIds} venueNote={activity.venueNote} lang={lang} />
      )}

      <div className="divide-y divide-gray-300 border-t grid-line dark:divide-white/10">
        {entries.map(({ entry, entryIndex, status }) => {
          const href = getTicketEntryLink(activity, entry)
          const price = getTicketEntryPrice(activity, entry)

          return (
            <TicketEntryRow
              key={entryIndex}
              entry={entry}
              lang={lang}
              href={href}
              price={price}
              status={status}
              activityTimeZone={activity.timeZone}
            />
          )
        })}
      </div>
    </section>
  )
}
