import { useEffect, useState } from "react"
import { useLocation } from "react-router-dom"
import { TRANSLATIONS } from "../i18n"
import ACTIVITIES from "../data/activities.yaml"
import type { Activity, Language } from "../types"
import {
  compareActivitiesByStart,
  getCurrentActivities,
} from "../utils/activityStatus"
import { getActivityCategoryLabel } from "../utils/categoryLabels"
import { hasCurrentTicketInfo } from "../utils/ticketStatus"
import { ACTIVITY_CATEGORY_META, ACTIVITY_CATEGORY_ORDER } from "../config/activityCategories"
import useJapanNow from "../hooks/useJapanNow"
import ActivityRow from "../components/ActivityRow"
import AddToCalendar from "../components/AddToCalendar"
import { PageHeader, PageLayout } from "../components/PageLayout"

export default function Activities({ lang }: { lang: Language }) {
  const t = TRANSLATIONS[lang]
  const location = useLocation()
  const [highlighted, setHighlighted] = useState<string | null>(null)
  const now = useJapanNow()
  const activities = ACTIVITIES as Activity[]
  const currentActivities = getCurrentActivities(activities, now)

  useEffect(() => {
    const activityId = (location.state as { activityId?: string })?.activityId
    if (!activityId) return
    requestAnimationFrame(() => {
      const el = document.getElementById(`event-${activityId}`)
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" })
        setHighlighted(activityId)
        setTimeout(() => setHighlighted(null), 2000)
      }
    })
  }, [location.state])

  return (
    <PageLayout>
      <PageHeader title={t.activities} subtitle="Performance Schedule" />

      <div className="space-y-18">
        {ACTIVITY_CATEGORY_ORDER.map((category) => {
          const categoryActivities = currentActivities
            .filter((activity) => activity.category === category)
            .sort(compareActivitiesByStart)
          if (categoryActivities.length === 0) return null
          const Icon = ACTIVITY_CATEGORY_META[category].icon

          return (
            <section key={category} className="space-y-8">
              <h3 className="text-[15px] uppercase tracking-[0.3em] font-bold text-coco-accent flex items-center gap-3">
                <Icon className="h-4 w-4" aria-hidden="true" />
                {getActivityCategoryLabel(category, t)}
              </h3>
              <div className="border-t grid-line divide-y divide-gray-300 dark:divide-white/10">
                {categoryActivities.map((act) => (
                  <ActivityRow
                    key={act.id}
                    activity={act}
                    lang={lang}
                    highlighted={highlighted === act.id}
                    scheduleContent={<AddToCalendar activity={act} lang={lang} now={now} />}
                    ticketAction={
                      hasCurrentTicketInfo(act, now)
                        ? {
                            label: t.ticket_info,
                            to: "/tickets",
                            state: { ticketActivityId: act.id },
                          }
                        : undefined
                    }
                  />
                ))}
              </div>
            </section>
          )
        })}
      </div>

    </PageLayout>
  )
}
