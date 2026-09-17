import type { Activity, Language } from "../types"
import { TRANSLATIONS } from "../i18n"
import { getActivityCategoryLabel } from "../utils/categoryLabels"
import { getTicketEntryLink, getTicketEntryPrice } from "../utils/ticketStatus"
import { CatalogEntry, CatalogEntryTitle, CatalogDisclosure, CatalogItemTitle } from "./ArchiveCatalog"
import VenueLabel from "./VenueLabel"
import ActivityPerformanceDetails from "./ActivityPerformanceDetails"
import ActivityResourcesDisclosure from "./ActivityResourcesDisclosure"

export default function ArchivedActivityEntry({ activity, lang }: { activity: Activity; lang: Language }) {
  const t = TRANSLATIONS[lang]
  const tickets = activity.ticketInfo?.entries ?? []
  return <CatalogEntry>
    <div className="mb-2 flex flex-wrap gap-x-3 text-xs leading-5 text-coco-ink/50">
      <span>{activity.scheduleLabel}</span><span>{getActivityCategoryLabel(activity.category, t)}</span>
    </div>
    <CatalogEntryTitle href={activity.link}>{activity.title[lang]}</CatalogEntryTitle>
    {activity.venue && <div className="mt-2"><VenueLabel venue={activity.venue[lang]} /></div>}
    {activity.description && <p className="mt-2 text-sm leading-6 text-coco-ink/60">{activity.description[lang]}</p>}
    <ActivityPerformanceDetails performances={activity.performances} durationMinutes={activity.durationMinutes} lang={lang} startLabel={activity.category === "Program" ? t.milestone_update : undefined} />
    <ActivityResourcesDisclosure activityId={activity.id} lang={lang} />
    {tickets.length > 0 && <CatalogDisclosure label={t.archived_ticket_records.replace("{count}", String(tickets.length))}>
      <div className="divide-y divide-coco-ink/10">
        {tickets.map((entry, index) => <section key={index} className="space-y-2 py-3 first:pt-0">
          <CatalogItemTitle href={getTicketEntryLink(activity, entry)}>{entry.type[lang]}</CatalogItemTitle>
          <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 text-xs leading-6">
            <dt className="text-coco-ink/45">{t.ticket_schedule}</dt><dd>{entry.scheduleLabel}</dd>
            <dt className="text-coco-ink/45">{t.ticket_price}</dt><dd>{getTicketEntryPrice(activity, entry)?.[lang] ?? t.ticket_status_tba}</dd>
          </dl>
          {entry.description && <p className="text-xs leading-6 text-coco-ink/60">{entry.description[lang]}</p>}
        </section>)}
      </div>
    </CatalogDisclosure>}
  </CatalogEntry>
}
