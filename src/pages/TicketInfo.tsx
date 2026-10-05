import { useActivityHighlight } from "../hooks/useActivityHighlight"
import { useLocation } from "react-router-dom"
import { TRANSLATIONS } from "../i18n"
import ACTIVITIES from "../data/activities.yaml"
import type { Activity, Language } from "../types"
import { getCurrentTicketGroups } from "../utils/ticketStatus"
import { PageHeader, PageLayout } from "../components/PageLayout"
import TicketGroup from "../components/TicketGroup"
import useJapanNow from "../hooks/useJapanNow"

export default function TicketInfo({ lang }: { lang: Language }) {
  const t = TRANSLATIONS[lang]
  const location = useLocation()
  const highlighted = useActivityHighlight((location.state as { ticketActivityId?: string })?.ticketActivityId, "ticket-", location.state)
  const now = useJapanNow()
  const activities = ACTIVITIES as Activity[]
  const ticketGroups = getCurrentTicketGroups(activities, now)


  return (
    <PageLayout>
      <PageHeader title={t.ticket_info} subtitle="Ticket Schedule & Prices" />

      <div className="space-y-12">
        {ticketGroups.map((group) => (
          <TicketGroup
            key={group.activity.id}
            group={group}
            lang={lang}
            highlighted={highlighted === group.activity.id}
          />
        ))}
      </div>
    </PageLayout>
  )
}
