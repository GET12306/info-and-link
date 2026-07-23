import { useEffect, useState } from "react"
import { useLocation } from "react-router-dom"
import { TRANSLATIONS } from "../i18n"
import ACTIVITIES from "../data/activities.yaml"
import type { Activity, Language } from "../types"
import { getCurrentTicketGroups } from "../utils/ticketStatus"
import ArchiveLink from "../components/ArchiveLink"
import EmptyState from "../components/EmptyState"
import { PageHeader, PageLayout } from "../components/PageLayout"
import TicketGroup from "../components/TicketGroup"

export default function TicketInfo({ lang }: { lang: Language }) {
  const t = TRANSLATIONS[lang]
  const location = useLocation()
  const [highlighted, setHighlighted] = useState<number | null>(null)
  const activities = ACTIVITIES as Activity[]
  const ticketGroups = getCurrentTicketGroups(activities)

  useEffect(() => {
    const scrollToTicket = (location.state as { scrollToTicket?: number })?.scrollToTicket
    if (scrollToTicket === undefined) return

    requestAnimationFrame(() => {
      const el = document.getElementById(`ticket-${scrollToTicket}`)
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" })
        setHighlighted(scrollToTicket)
        setTimeout(() => setHighlighted(null), 2000)
      }
    })
  }, [location.state])

  return (
    <PageLayout>
      <PageHeader title={t.ticket_info} subtitle="Ticket Schedule & Prices" />

      {ticketGroups.length > 0 ? (
        <div className="space-y-12">
          {ticketGroups.map((group) => (
            <TicketGroup
              key={group.activity.originalIndex}
              group={group}
              lang={lang}
              variant="current"
              highlighted={highlighted === group.activity.originalIndex}
            />
          ))}
        </div>
      ) : (
        <EmptyState title={t.no_ticket_info} />
      )}

      <ArchiveLink
        to="/tickets/past"
        title={t.view_past_tickets}
        description={t.view_past_tickets_description}
      />
    </PageLayout>
  )
}
