import { useEffect, useState } from "react"
import { useLocation } from "react-router-dom"
import { TRANSLATIONS } from "../i18n"
import ACTIVITIES from "../data/activities.yaml"
import type { Activity, Language } from "../types"
import { getCurrentActivities, getPastActivities } from "../utils/activityStatus"
import { getActivityCategoryLabel } from "../utils/categoryLabels"
import { hasCurrentTicketInfo } from "../utils/ticketStatus"
import { ACTIVITY_CATEGORY_META, ACTIVITY_CATEGORY_ORDER } from "../config/activityCategories"
import ActivityRow from "../components/ActivityRow"
import ArchiveLink from "../components/ArchiveLink"
import { PageHeader, PageLayout } from "../components/PageLayout"

export default function Activities({ lang }: { lang: Language }) {
  const t = TRANSLATIONS[lang]
  const location = useLocation()
  const [highlighted, setHighlighted] = useState<number | null>(null)
  const activities = ACTIVITIES as Activity[]
  const currentActivities = getCurrentActivities(activities)
  const pastActivities = getPastActivities(activities)

  useEffect(() => {
    const scrollTo = (location.state as { scrollTo?: number })?.scrollTo
    if (scrollTo === undefined) return
    requestAnimationFrame(() => {
      const el = document.getElementById(`event-${scrollTo}`)
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" })
        setHighlighted(scrollTo)
        setTimeout(() => setHighlighted(null), 2000)
      }
    })
  }, [location.state])

  return (
    <PageLayout>
      <PageHeader title={t.activities} subtitle="Performance Schedule & History" />

      <div className="space-y-18">
        {ACTIVITY_CATEGORY_ORDER.map((category) => {
          const categoryActivities = currentActivities.filter(
            (activity) => activity.category === category
          )
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
                    key={act.originalIndex}
                    activity={act}
                    lang={lang}
                    highlighted={highlighted === act.originalIndex}
                    ticketAction={
                      hasCurrentTicketInfo(act)
                        ? {
                            label: t.ticket_info,
                            to: "/tickets",
                            state: { scrollToTicket: act.originalIndex },
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

      {pastActivities.length > 0 && (
        <ArchiveLink
          to="/activities/past"
          title={t.view_past_activities}
          description={t.view_past_activities_description}
        />
      )}
    </PageLayout>
  )
}
