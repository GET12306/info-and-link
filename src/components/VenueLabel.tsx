import { MapPin } from "lucide-react"
import { Link } from "react-router-dom"
import { getVenue, getVenueName } from "../data/venues"
import type { Language, LocalizedText } from "../types"

export default function VenueLabel({
  venueIds,
  venueNote,
  lang,
  linked = false,
}: {
  venueIds?: string[]
  venueNote?: LocalizedText
  lang: Language
  linked?: boolean
}) {
  const venues = (venueIds ?? []).map(getVenue).filter(Boolean)
  const note = venueNote?.[lang] || venueNote?.ja || venueNote?.en
  if (venues.length === 0 && !note) return null

  return (
    <div className="flex items-start gap-2 text-sm leading-6 text-coco-ink/60">
      <MapPin className="mt-1 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span className="flex min-w-0 flex-wrap items-center gap-x-1.5">
        {venues.map((venue, index) => venue && (
          <span key={venue.id} className="inline-flex items-center gap-1.5">
            {index > 0 && <span aria-hidden="true">/</span>}
            {linked ? (
              <Link
                to={`/venues/${venue.id}`}
                className="underline decoration-coco-ink/20 underline-offset-4 transition-colors hover:text-coco-accent hover:decoration-coco-accent focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coco-accent"
              >
                {getVenueName(venue, lang)}
              </Link>
            ) : getVenueName(venue, lang)}
          </span>
        ))}
        {note && (
          <span className="inline-flex items-center gap-1.5">
            {venues.length > 0 && <span aria-hidden="true">/</span>}
            <span>{note}</span>
          </span>
        )}
      </span>
    </div>
  )
}
