import { ChevronLeft, ChevronRight } from "lucide-react"
import type { CalendarMonthData } from "../hooks/useCalendarEvents"
import type { Language } from "../types"
import type { IndexedActivity } from "../utils/activityStatus"
import { TRANSLATIONS } from "../i18n"
import { getActivityCategoryLabel } from "../utils/categoryLabels"

const DAY_LABELS_JA = ["日", "月", "火", "水", "木", "金", "土"]
const DAY_LABELS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

function formatMonthLabel(key: string, lang: Language): string {
  const [y, m] = key.split("-")
  const date = new Date(parseInt(y), parseInt(m) - 1)
  return new Intl.DateTimeFormat(lang === "ja" ? "ja-JP" : "en-US", {
    year: "numeric",
    month: "long",
  }).format(date)
}

export default function CalendarMonth({
  month,
  lang,
  today,
  activities,
  onSelectEvent,
  hasPrev,
  hasNext,
  onPrev,
  onNext,
  className = "",
}: {
  month: CalendarMonthData
  lang: Language
  today?: string
  activities: IndexedActivity[]
  onSelectEvent: (activityIndex: number) => void
  hasPrev: boolean
  hasNext: boolean
  onPrev: () => void
  onNext: () => void
  className?: string
}) {
  const labels = lang === "ja" ? DAY_LABELS_JA : DAY_LABELS_EN
  const t = TRANSLATIONS[lang]
  const isToday = today ?? ""

  return (
    <div className={`border grid-line rounded bg-white dark:bg-neutral-900 ${className}`}>
      <div className="flex items-center justify-between p-4">
        <button
          onClick={onPrev}
          disabled={!hasPrev}
          className="p-1 rounded hover:bg-coco-accent/10 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="text-xs font-bold uppercase tracking-widest text-coco-accent">
          {formatMonthLabel(month.key, lang)}
        </div>
        <button
          onClick={onNext}
          disabled={!hasNext}
          className="p-1 rounded hover:bg-coco-accent/10 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
          aria-label="Next month"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[720px]">
          <div className="grid grid-cols-7 border-t grid-line">
            {labels.map((label, i) => (
              <div
                key={i}
                className="border-r grid-line py-2 text-center text-[10px] font-medium opacity-40 last:border-r-0"
              >
                {label}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 border-t border-l grid-line">
            {month.weeks.flat().map((day, i) => {
              const isTodayDay = day.date === isToday

              return (
                <div
                  key={i}
                  className={`min-h-28 border-r border-b grid-line p-2 ${
                    day.dayNumber === null ? "bg-coco-ink/[0.015]" : ""
                  }`}
                >
                  {day.dayNumber !== null && (
                    <>
                      <div className="mb-2 flex min-h-6 items-center justify-between">
                        <span
                          className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                            isTodayDay
                              ? "bg-coco-accent text-white font-bold shadow-sm"
                              : "text-coco-ink/55"
                          }`}
                        >
                          {day.dayNumber}
                        </span>
                      </div>

                      {day.events.length > 0 && (
                        <div className="space-y-1.5">
                          {day.events.map((event, eventIndex) => {
                            const activity = activities[event.activityIndex]
                            if (!activity) return null

                            return (
                              <button
                                key={`${event.activityIndex}-${eventIndex}`}
                                type="button"
                                onClick={() => onSelectEvent(activity.originalIndex)}
                                className="block w-full border-l-2 border-coco-accent bg-coco-accent/5 px-1.5 py-1 text-left transition-colors hover:bg-coco-accent/10 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-coco-accent"
                                aria-label={`${activity.title[lang]} — ${
                                  lang === "ja" ? "活動ページへ" : "View event details"
                                }`}
                              >
                                <span className="block text-[8px] font-bold uppercase tracking-wider text-coco-accent/75">
                                  {getActivityCategoryLabel(activity.category, t)}
                                </span>
                                <span className="mt-0.5 block break-words text-[10px] leading-snug text-coco-ink/80">
                                  {activity.title[lang]}
                                </span>
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
