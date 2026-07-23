import { TRANSLATIONS } from "../i18n"
import ACTIVITIES from "../data/activities.yaml"
import type { Activity, Language } from "../types"
import { getPastActivities } from "../utils/activityStatus"
import { getActivityCategoryLabel } from "../utils/categoryLabels"
import ActivityRow from "../components/ActivityRow"
import EmptyState from "../components/EmptyState"
import { PageHeader, PageLayout } from "../components/PageLayout"

export default function PastActivities({ lang }: { lang: Language }) {
  const t = TRANSLATIONS[lang]
  const pastActivities = getPastActivities(ACTIVITIES as Activity[])

  return (
    <PageLayout>
      <PageHeader
        title={t.past_activities}
        subtitle="Archived Activities History"
        backLink={{ to: "/activities", label: t.back_to_activities }}
      />

      {pastActivities.length > 0 ? (
        <div className="border-t grid-line divide-y divide-gray-300 dark:divide-white/10">
          {pastActivities.map((act) => (
            <ActivityRow
              key={act.originalIndex}
              activity={act}
              lang={lang}
              categoryLabel={getActivityCategoryLabel(act.category, t)}
            />
          ))}
        </div>
      ) : (
        <EmptyState title={t.no_past_activities} />
      )}
    </PageLayout>
  )
}
