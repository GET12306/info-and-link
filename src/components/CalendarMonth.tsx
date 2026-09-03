import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"
import type {
  CalendarEvent,
  CalendarMonthData,
} from "../hooks/useCalendarEvents"
import type { Language } from "../types"
import type { IndexedActivity } from "../utils/activityStatus"
import { TRANSLATIONS } from "../i18n"
import { getActivityCategoryLabel } from "../utils/categoryLabels"

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

function CalendarEventCard({
  event,
  activity,
  lang,
  now,
  layout,
  onSelect,
}: {
  event: CalendarEvent
  activity: IndexedActivity
  lang: Language
  now?: string
  layout: "mobile" | "desktop"
  onSelect: (activityIndex: number) => void
}) {
  const t = TRANSLATIONS[lang]
  const isPast = now ? now > event.endAt : false
  const category = getActivityCategoryLabel(activity.category, t)
  const accessibleLabel = `${event.startTime ? `${event.startTime} ` : ""}${
    activity.title[lang]
  }`

  if (layout === "mobile") {
    return (
      <button
        type="button"
        disabled={isPast}
        onClick={() => onSelect(activity.originalIndex)}
        className={`block w-full min-w-0 border-l-[3px] px-3 py-2.5 text-left transition-colors ${
          isPast
            ? "cursor-default border-coco-ink/20 bg-coco-ink/[0.025]"
            : "border-coco-accent bg-coco-accent/5 hover:bg-coco-accent/10 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-coco-accent"
        }`}
        aria-label={
          isPast
            ? accessibleLabel
            : `${accessibleLabel} — ${
                lang === "ja" ? "活動ページへ" : "View event details"
              }`
        }
      >
        <span className="flex min-w-0 items-center gap-2">
          <span
            className={`min-w-0 truncate text-[10px] font-bold uppercase tracking-wide ${
              isPast ? "text-coco-ink/40" : "text-coco-accent/75"
            }`}
          >
            {category}
          </span>
          {event.startTime && (
            <time
              dateTime={event.startAt}
              className={`shrink-0 text-[11px] font-medium ${
                isPast ? "text-coco-ink/40" : "text-coco-accent"
              }`}
            >
              {event.startTime}
            </time>
          )}
        </span>
        <span
          className={`mt-1 line-clamp-2 text-sm font-medium leading-5 ${
            isPast ? "text-coco-ink/55" : "text-coco-ink/85"
          }`}
        >
          {activity.title[lang]}
        </span>
      </button>
    )
  }

  return (
    <button
      type="button"
      disabled={isPast}
      onClick={() => onSelect(activity.originalIndex)}
      className={`block h-14 w-full min-w-0 overflow-hidden border-l-[3px] px-2 py-1.5 text-left transition-colors ${
        isPast
          ? "cursor-default border-coco-ink/20 bg-coco-ink/[0.025]"
          : "border-coco-accent bg-coco-accent/5 hover:bg-coco-accent/10 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-coco-accent"
      }`}
      aria-label={
        isPast
          ? accessibleLabel
          : `${accessibleLabel} — ${
              lang === "ja" ? "活動ページへ" : "View event details"
            }`
      }
    >
      <span className="flex min-w-0 items-center gap-1">
        <span
          className={`min-w-0 truncate text-[10px] font-bold uppercase tracking-wide ${
            isPast ? "text-coco-ink/40" : "text-coco-accent/75"
          }`}
        >
          {category}
        </span>
        {event.startTime && (
          <time
            dateTime={event.startAt}
            className={`shrink-0 text-[10px] ${
              isPast ? "text-coco-ink/40" : "text-coco-accent"
            }`}
          >
            {event.startTime}
          </time>
        )}
      </span>
      <span
        className={`mt-1 block truncate text-xs leading-snug ${
          isPast ? "text-coco-ink/55" : "text-coco-ink/80"
        }`}
      >
        {activity.title[lang]}
      </span>
    </button>
  )
}

export default function CalendarMonth({
  month,
  lang,
  today,
  now,
  activities,
  onSelectEvent,
  hasPrev,
  hasNext,
  onPrev,
  onNext,
  monthKeys,
  onSelectMonth,
  className = "",
}: {
  month: CalendarMonthData
  lang: Language
  today?: string
  now?: string
  activities: IndexedActivity[]
  onSelectEvent: (activityIndex: number) => void
  hasPrev: boolean
  hasNext: boolean
  onPrev: () => void
  onNext: () => void
  monthKeys: string[]
  onSelectMonth: (monthKey: string) => void
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
        <div className="relative inline-flex items-center rounded transition-colors hover:bg-coco-accent/10 focus-within:bg-coco-accent/10">
          <select
            value={month.key}
            onChange={(event) => onSelectMonth(event.target.value)}
            aria-label={lang === "ja" ? "表示する月を選択" : "Select month"}
            className="cursor-pointer appearance-none bg-transparent py-1 pl-3 pr-8 text-xs font-bold uppercase tracking-widest text-coco-accent outline-none"
          >
            {monthKeys.map((monthKey) => (
              <option key={monthKey} value={monthKey}>
                {formatMonthLabel(monthKey, lang)}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-2 h-3.5 w-3.5 text-coco-accent"
            aria-hidden="true"
          />
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

      <div className="border-t grid-line lg:hidden">
        <div className="grid grid-cols-7">
          {labels.map((label, i) => (
            <div
              key={i}
              className="border-r grid-line py-2 text-center text-[10px] font-medium opacity-40 last:border-r-0"
            >
              {lang === "ja" ? label : DAY_LABELS_EN_COMPACT[i]}
            </div>
          ))}
        </div>

        {month.weeks.map((week, weekIndex) => {
          const weekHasEvents = week.some((day) => day.events.length > 0)

          return (
            <section key={weekIndex} className="border-t grid-line first:border-t-0">
              <div className="grid grid-cols-7">
                {week.map((day, dayIndex) => {
                  const isTodayDay = day.date === isToday

                  return (
                    <div
                      key={dayIndex}
                      className={`flex min-h-12 flex-col items-center border-r grid-line py-1.5 last:border-r-0 ${
                        day.dayNumber === null ? "bg-coco-ink/[0.015]" : ""
                      }`}
                    >
                      {day.dayNumber !== null && (
                        <>
                          <span
                            className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                              isTodayDay
                                ? "bg-coco-accent font-bold text-white shadow-sm"
                                : "text-coco-ink/55"
                            }`}
                          >
                            {day.dayNumber}
                          </span>
                          {day.events.length > 0 && (
                            <span
                              className="mt-1 block h-1.5 w-1.5 rounded-full bg-coco-accent"
                              aria-label={lang === "ja" ? "活動あり" : "Has events"}
                            />
                          )}
                        </>
                      )}
                    </div>
                  )
                })}
              </div>

              {weekHasEvents && (
                <div className="space-y-3 border-t grid-line bg-coco-ink/[0.0125] px-2 py-3">
                  {week.map((day, dayIndex) => {
                    if (day.dayNumber === null || day.events.length === 0) {
                      return null
                    }

                    return (
                      <div
                        key={dayIndex}
                        className="grid grid-cols-[2.75rem_minmax(0,1fr)] gap-2"
                      >
                        <div className="pt-2 text-center">
                          <div className="text-sm font-medium text-coco-ink/70">
                            {day.dayNumber}
                          </div>
                          <div className="mt-0.5 text-[9px] uppercase tracking-wide text-coco-ink/40">
                            {lang === "ja"
                              ? DAY_LABELS_JA[dayIndex]
                              : DAY_LABELS_EN_COMPACT[dayIndex]}
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          {day.events.map((event, eventIndex) => {
                            const activity = activities[event.activityIndex]
                            if (!activity) return null

                            return (
                              <CalendarEventCard
                                key={`${event.activityIndex}-${
                                  event.performanceIndex ?? eventIndex
                                }`}
                                event={event}
                                activity={activity}
                                lang={lang}
                                now={now}
                                layout="mobile"
                                onSelect={onSelectEvent}
                              />
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          )
        })}
      </div>

      <div className="hidden overflow-x-auto lg:block">
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
                              ? "bg-coco-accent font-bold text-white shadow-sm"
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
                              <CalendarEventCard
                                key={`${event.activityIndex}-${
                                  event.performanceIndex ?? eventIndex
                                }`}
                                event={event}
                                activity={activity}
                                lang={lang}
                                now={now}
                                layout="desktop"
                                onSelect={onSelectEvent}
                              />
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
