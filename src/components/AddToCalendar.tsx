import { CalendarPlus } from "lucide-react"
import { TRANSLATIONS } from "../i18n"
import type { Activity, Language } from "../types"
import { getCalendarOccurrences, getCalendarOccurrenceKey } from "../utils/activityCalendar"
import { getActivityOccurrences } from "../utils/activitySchedule"
import useCalendarDownload from "../hooks/useCalendarDownload"
import ActivityPerformanceDetails from "./ActivityPerformanceDetails"

export default function AddToCalendar({ activity, lang, now }: {
  activity: Activity
  lang: Language
  now: string
}) {
  const { download, busy, failed } = useCalendarDownload(activity, lang, now)
  const t = TRANSLATIONS[lang]
  const occurrences = getCalendarOccurrences(activity, now)
  const availableKeys = new Set(occurrences.map(getCalendarOccurrenceKey))
  const buttonClass = "inline-flex min-h-9 shrink-0 items-center justify-center gap-1.5 rounded-full border grid-line px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-coco-accent transition-colors hover:bg-coco-accent/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coco-accent disabled:opacity-50"

  return (
    <ActivityPerformanceDetails
      occurrences={getActivityOccurrences(activity)}
      lang={lang}
      startLabel={activity.category === "Program" ? t.milestone_update : undefined}
      actions={occurrences.length > 0 && (
        <button type="button" disabled={busy} className={buttonClass} onClick={() => download({ kind: "all" })}>
          <CalendarPlus className="h-3.5 w-3.5" aria-hidden="true" />
          {t.calendar_add_all}
        </button>
      )}
      renderPerformanceAction={(occurrence) => {
        const key = getCalendarOccurrenceKey(occurrence)
        if (!availableKeys.has(key)) return null
        const label = [key.replace("T", " "), occurrence.label?.[lang]].filter(Boolean).join(" · ")
        return (
          <button type="button" disabled={busy} className={buttonClass}
            aria-label={`${t.calendar_add_performance}: ${label}`}
            onClick={() => download({ kind: "performances", keys: [key] })}>
            <CalendarPlus className="h-3.5 w-3.5" aria-hidden="true" />
            {t.calendar_add_performance}
          </button>
        )
      }}
      footer={<>
        {failed && <p role="alert" className="mt-2 text-xs text-coco-accent">{t.calendar_error}</p>}
      </>}
    />
  )
}
