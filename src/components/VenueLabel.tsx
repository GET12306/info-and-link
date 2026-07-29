import { MapPin } from "lucide-react"

export default function VenueLabel({ venue }: { venue: string }) {
  return (
    <div className="flex items-start gap-2 text-sm leading-6 text-coco-ink/60">
      <MapPin className="mt-1 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{venue}</span>
    </div>
  )
}
