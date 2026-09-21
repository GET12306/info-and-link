import { useEffect, useState } from "react"
import { TRANSLATIONS } from "../i18n"
import ACTIVITIES from "../data/activities.yaml"
import type { Activity, Language } from "../types"
import { getPastActivities } from "../utils/activityStatus"
import { ArchiveCatalog, CatalogDisclosure, CatalogFilterBar, CatalogGrid } from "../components/ArchiveCatalog"
import ArchivedActivityEntry from "../components/ArchivedActivityEntry"
import HistoricalActivityCalendar from "../components/HistoricalActivityCalendar"
import useJapanNow from "../hooks/useJapanNow"
import { ACTIVITY_CATEGORY_ORDER, type ActivityCategory } from "../config/activityCategories"
import { getActivityCategoryLabel } from "../utils/categoryLabels"

type ActivityFilter = "all" | ActivityCategory

export default function PastActivities({ lang }: { lang: Language }) {
  const t = TRANSLATIONS[lang]
  const now = useJapanNow()
  const [filter, setFilter] = useState<ActivityFilter>("all")
  const [focusedActivityId, setFocusedActivityId] = useState<string | null>(null)
  const activities = getPastActivities(ACTIVITIES as Activity[], now)
  const visible = filter === "all" ? activities : activities.filter(activity => activity.category === filter)
  const filters: { value: ActivityFilter; label: string }[] = [
    { value: "all", label: t.past_activities_filter_all },
    ...ACTIVITY_CATEGORY_ORDER
      .filter(category => activities.some(activity => activity.category === category))
      .map(category => ({ value: category, label: getActivityCategoryLabel(category, t) })),
  ]

  useEffect(() => {
    if (!focusedActivityId) return
    const element = document.getElementById(`archive-activity-${focusedActivityId}`)
    if (!element) return
    element.scrollIntoView({ behavior: "smooth", block: "start" })
    setFocusedActivityId(null)
  }, [filter, focusedActivityId])

  const selectFromCalendar = (activityId: string) => {
    setFilter("all")
    setFocusedActivityId(activityId)
  }

  return <ArchiveCatalog title={t.past_activities} backLabel={t.back_to_museum}>
    {activities.length ? <>
      <CatalogFilterBar<ActivityFilter> label={t.past_activities_filter_label} options={filters} value={filter} onChange={setFilter} />
      <CatalogDisclosure label={t.past_activities_calendar}>
        <p className="mb-3 text-xs leading-6 text-coco-ink/50">{t.past_activities_calendar_description}</p>
        <HistoricalActivityCalendar activities={activities} lang={lang} onSelectActivity={selectFromCalendar} />
      </CatalogDisclosure>
      <p role="status" className="text-xs text-coco-ink/50">{t.past_activities_count.replace("{count}", String(visible.length))}</p>
      {visible.length
        ? <CatalogGrid>{visible.map(activity => <ArchivedActivityEntry key={activity.id} activity={activity} lang={lang} />)}</CatalogGrid>
        : <p className="text-sm text-coco-ink/60">{t.past_activities_no_results}</p>}
    </> : <p className="text-sm text-coco-ink/60">{t.no_past_activities}</p>}
  </ArchiveCatalog>
}
