import { TRANSLATIONS } from "../i18n"
import type { Language, TicketEntry } from "../types"
import type { TicketStatus } from "../utils/ticketStatus"
import ExternalAnchor from "./ExternalAnchor"

const statusClassNames: Record<TicketStatus, string> = {
  upcoming: "bg-coco-accent/10 text-coco-accent",
  open: "bg-coco-accent text-white",
  past: "bg-coco-ink/10 text-coco-ink/50 dark:bg-white/10",
  tba: "bg-coco-ink/5 text-coco-ink/50 dark:bg-white/10",
}

type TicketEntryRowProps = {
  entry: TicketEntry
  lang: Language
  href: string
} & (
  | { variant: "current"; status: TicketStatus }
  | { variant: "past"; status?: never }
)

export default function TicketEntryRow(props: TicketEntryRowProps) {
  const { entry, lang, href, variant } = props
  const t = TRANSLATIONS[lang]

  return (
    <div className="flex flex-col gap-4 py-5 md:flex-row md:items-start">
      <div className="md:w-32">
        {variant === "current" ? (
          <span
            className={`inline-flex rounded px-2 py-1 text-[10px] font-bold uppercase tracking-widest ${
              statusClassNames[props.status]
            }`}
          >
            {t[`ticket_status_${props.status}`]}
          </span>
        ) : (
          <span className="font-mono text-sm text-coco-ink/40">
            {entry.endDate ?? entry.period}
          </span>
        )}
      </div>

      <div className="flex-1 space-y-3">
        <ExternalAnchor
          href={href}
          className="inline-block text-xl font-serif leading-relaxed transition-colors hover:text-coco-accent"
        >
          {entry.type[lang]}
        </ExternalAnchor>
        <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div>
            <div className="mb-1 text-[10px] uppercase tracking-widest text-coco-ink/40">
              {t.ticket_period}
            </div>
            <div className="text-coco-ink/70">{entry.period}</div>
          </div>
          <div>
            <div className="mb-1 text-[10px] uppercase tracking-widest text-coco-ink/40">
              {t.ticket_price}
            </div>
            <div className="text-coco-ink/70">{entry.price[lang]}</div>
          </div>
        </div>
        {entry.note && <p className="text-sm text-coco-ink/50">{entry.note[lang]}</p>}
      </div>
    </div>
  )
}
