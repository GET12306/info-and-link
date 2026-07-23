import { ChevronLeft, ChevronRight } from "lucide-react"
import type { CalendarMonthData } from "../hooks/useCalendarEvents"
import type { Language } from "../types"
import { getActivityStatus, type IndexedActivity } from "../utils/activityStatus"
import { TRANSLATIONS } from "../i18n"
import { getActivityCategoryLabel } from "../utils/categoryLabels"
import { ACTIVITY_CATEGORY_META } from "../config/activityCategories"

const DAY_LABELS_JA = ["日", "月", "火", "水", "木", "金", "土"]
const DAY_LABELS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const DAY_LABELS_EN_COMPACT = ["S", "M", "T", "W", "T", "F", "S"]

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

      <div className="overflow-hidden lg:overflow-x-auto">
        <div className="w-full lg:min-w-[720px]">
          <div className="grid grid-cols-7 border-t grid-line">
            {labels.map((label, i) => (
              <div
                key={i}
                className="border-r grid-line py-2 text-center text-[10px] font-medium opacity-40 last:border-r-0"
              >
                <span className="lg:hidden">{lang === "ja" ? label : DAY_LABELS_EN_COMPACT[i]}</span>
                <span className="hidden lg:inline">{label}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 border-t border-l grid-line">
            {month.weeks.flat().map((day, i) => {
              const isTodayDay = day.date === isToday

              return (
                <div
                  key={i}
                  className={`min-h-24 border-r border-b grid-line p-1 lg:min-h-28 lg:p-2 ${
                    day.dayNumber === null ? "bg-coco-ink/[0.015]" : ""
                  }`}
                >
                  {day.dayNumber !== null && (
                    <>
                      <div className="mb-1.5 flex min-h-5 items-center justify-between lg:mb-2 lg:min-h-6">
                        <span
                          className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] sm:text-xs lg:h-6 lg:w-6 ${
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
                            const isPastActivity = today
                              ? getActivityStatus(activity, today) === "past"
                              : false

                            return (
                              <button
                                key={`${event.activityIndex}-${eventIndex}`}
                                type="button"
                                disabled={isPastActivity}
                                onClick={() => {
                                  if (!isPastActivity) onSelectEvent(activity.originalIndex)
                                }}
                                className={`block w-full border-t-2 px-0.5 py-1.5 text-center transition-colors sm:px-1 sm:py-2 lg:border-l-2 lg:border-t-0 lg:px-1.5 lg:py-1 lg:text-left ${
                                  isPastActivity
                                    ? "cursor-default border-coco-ink/20 bg-coco-ink/[0.025]"
                                    : "border-coco-accent bg-coco-accent/5 hover:bg-coco-accent/10 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-coco-accent"
                                }`}
                                aria-label={
                                  isPastActivity
                                    ? activity.title[lang]
                                    : `${activity.title[lang]} — ${
                                        lang === "ja" ? "活動ページへ" : "View event details"
                                      }`
                                }
                              >
                                <span
                                  className={`block break-words text-[10px] font-bold leading-tight sm:text-xs lg:hidden ${
                                    isPastActivity ? "text-coco-ink/55" : "text-coco-accent"
                                  }`}
                                >
                                  {ACTIVITY_CATEGORY_META[activity.category].compactLabel[lang]}
                                </span>
                                <span
                                  className={`hidden text-[8px] font-bold uppercase tracking-wider lg:block ${
                                    isPastActivity ? "text-coco-ink/40" : "text-coco-accent/75"
                                  }`}
                                >
                                  {getActivityCategoryLabel(activity.category, t)}
                                </span>
                                <span
                                  className={`mt-0.5 hidden break-words text-[10px] leading-snug lg:block ${
                                    isPastActivity ? "text-coco-ink/55" : "text-coco-ink/80"
                                  }`}
                                >
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
