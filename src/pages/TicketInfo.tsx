import { useEffect, useState } from "react"
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
  const [highlighted, setHighlighted] = useState<string | null>(null)
  const now = useJapanNow()
  const activities = ACTIVITIES as Activity[]
  const ticketGroups = getCurrentTicketGroups(activities, now)

  useEffect(() => {
    const activityId = (location.state as { ticketActivityId?: string })?.ticketActivityId
    if (!activityId) return

    requestAnimationFrame(() => {
      const el = document.getElementById(`ticket-${activityId}`)
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" })
        setHighlighted(activityId)
        setTimeout(() => setHighlighted(null), 2000)
      }
    })
  }, [location.state])

  return (
    <PageLayout>
      <PageHeader title={t.ticket_info} subtitle="Ticket Schedule & Prices" />

      <div className="space-y-12">
        {ticketGroups.map((group) => (
          <TicketGroup
            key={group.activity.id}
            group={group}
            lang={lang}
            variant="current"
            highlighted={highlighted === group.activity.id}
          />
        ))}
      </div>
    </PageLayout>
  )
}
