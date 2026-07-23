import { TRANSLATIONS } from "../i18n"
import ACTIVITIES from "../data/activities.yaml"
import type { Activity, Language } from "../types"
import { getPastTicketGroups } from "../utils/ticketStatus"
import EmptyState from "../components/EmptyState"
import { PageHeader, PageLayout } from "../components/PageLayout"
import TicketGroup from "../components/TicketGroup"

export default function PastTickets({ lang }: { lang: Language }) {
  const t = TRANSLATIONS[lang]
  const ticketGroups = getPastTicketGroups(ACTIVITIES as Activity[])

  return (
    <PageLayout>
      <PageHeader
        title={t.past_tickets}
        subtitle="Archived Ticket Information"
        backLink={{ to: "/tickets", label: t.back_to_ticket_info }}
      />

      {ticketGroups.length > 0 ? (
        <div className="space-y-12">
          {ticketGroups.map((group) => (
            <TicketGroup
              key={group.activity.originalIndex}
              group={group}
              lang={lang}
              variant="past"
            />
          ))}
        </div>
      ) : (
        <EmptyState title={t.no_past_tickets} />
      )}
    </PageLayout>
  )
}
