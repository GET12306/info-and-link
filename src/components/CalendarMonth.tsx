import { Bookmark, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"
import { useMemo, useState } from "react"
import {
  ACTIVITY_CATEGORY_META,
  ACTIVITY_CATEGORY_ORDER,
  type ActivityCategory,
} from "../config/activityCategories"
import type {
  CalendarEvent,
  CalendarMonthData,
} from "../hooks/useCalendarEvents"
import type { Activity, Language } from "../types"
import { TRANSLATIONS } from "../i18n"
import { getActivityCategoryLabel } from "../utils/categoryLabels"
import { formatActivityMilestone } from "../utils/activityMilestones"
import { instantFromSourceKey, sourceTimeZone } from "../utils/timeZone"

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
  isPast,
  layout,
  onSelect,
  actionLabel,
  attending = false,
}: {
  event: CalendarEvent
  activity: Activity
  lang: Language
  isPast: boolean
  layout: "mobile" | "desktop"
  onSelect: (activityId: string, archivePath?: string) => void
  actionLabel?: string
  attending?: boolean
}) {
  const t = TRANSLATIONS[lang]
  const isArchiveRecord = Boolean(event.archivePath)
  // An appearance archive is an already-published record, not an upcoming performance.
  // Its neutral tone must be independent of whether the record can still be opened.
  const isMuted = isArchiveRecord || isPast
  const isDisabled = isPast && !isArchiveRecord
  const cardTone = attending
    ? "border-violet-500 bg-violet-500/10 hover:bg-violet-500/15 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-violet-500"
    : isMuted
    ? `border-coco-ink/20 bg-coco-ink/[0.025] ${isDisabled
      ? "cursor-default"
      : "hover:bg-coco-ink/5 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-coco-ink/50"}`
    : "border-coco-accent bg-coco-accent/5 hover:bg-coco-accent/10 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-coco-accent"
  const title = event.episode
    ? `${activity.title[lang]} ${t.program_episode_number.replace("{episode}", event.episode)}`
    : activity.title[lang]
  const category = getActivityCategoryLabel(activity.category, t)
  const timeItems = [
    ...event.milestones.map((milestone) => ({
      at: milestone.at,
      text: formatActivityMilestone(milestone, lang),
    })),
    ...(event.startTime
      ? [{
          at: event.startTime,
          text: `${activity.category === "Program" ? t.milestone_update : t.milestone_start} ${event.startTime}`,
        }]
      : []),
  ].sort((a, b) => a.at.localeCompare(b.at))
  const timeSummary = timeItems.map((item) => item.text).join(" · ")
  const accentTone = attending
    ? "text-violet-700 dark:text-violet-300"
    : isMuted ? "text-coco-ink/40" : "text-coco-accent"
  const categoryTone = attending || isMuted ? accentTone : "text-coco-accent/75"
  const marker = attending
    ? <Bookmark className={`h-3 w-3 shrink-0 fill-current ${accentTone}`} aria-hidden="true" />
    : null
  const accessibleLabel = [timeSummary, title, attending && t.attendance_saved]
    .filter(Boolean)
    .join(" ")

  if (layout === "mobile") {
    return (
      <button
        type="button"
        disabled={isDisabled}
        onClick={() => onSelect(activity.id, event.archivePath)}
        className={`block w-full min-w-0 border-l-[3px] px-3 py-2.5 text-left transition-colors ${cardTone}`}
        aria-label={
          isDisabled
            ? accessibleLabel
            : `${accessibleLabel} — ${
            event.archivePath ? t.program_episode_view : actionLabel ?? (lang === "ja" ? "活動ページへ" : "View event details")
              }`
        }
      >
        <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
          {marker}
          <span
            className={`min-w-0 truncate text-[10px] font-bold uppercase tracking-wide ${categoryTone}`}
          >
            {category}
          </span>
          {timeItems.map((item) => (
            <span
              key={`${item.at}-${item.text}`}
              className={`shrink-0 text-[11px] font-medium ${accentTone}`}
            >
              {item.text}
            </span>
          ))}
        </span>
        <span
          className={`mt-1 line-clamp-2 text-sm font-medium leading-5 ${
            isMuted ? "text-coco-ink/55" : "text-coco-ink/85"
          }`}
        >
          {title}
        </span>
      </button>
    )
  }

  return (
    <button
      type="button"
      disabled={isDisabled}
      onClick={() => onSelect(activity.id, event.archivePath)}
      className={`block h-14 w-full min-w-0 overflow-hidden border-l-[3px] px-2 py-1.5 text-left transition-colors ${cardTone}`}
      aria-label={
        isDisabled
          ? accessibleLabel
          : `${accessibleLabel} — ${
              event.archivePath ? t.program_episode_view : actionLabel ?? (lang === "ja" ? "活動ページへ" : "View event details")
            }`
      }
    >
      <span className="flex min-w-0 items-center gap-1 text-[10px]">
        {marker}
        <span
          className={`min-w-0 truncate text-[10px] font-bold uppercase tracking-wide ${categoryTone}`}
        >
          {category}
        </span>
        {timeSummary && (
          <span
            className={`min-w-0 truncate ${accentTone}`}
          >
            · {timeSummary}
          </span>
        )}
      </span>
      <span
        className={`mt-1 block truncate text-xs leading-snug ${
          isMuted ? "text-coco-ink/55" : "text-coco-ink/80"
        }`}
      >
        {title}
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
  months,
  onSelectMonth,
  eventActionLabel,
  attendingKeys,
  className = "",
}: {
  month: CalendarMonthData
  lang: Language
  today?: string
  now?: string
  activities: Activity[]
  onSelectEvent: (activityId: string, archivePath?: string) => void
  hasPrev: boolean
  hasNext: boolean
  onPrev: () => void
  onNext: () => void
  months: CalendarMonthData[]
  onSelectMonth: (monthKey: string) => void
  eventActionLabel?: string
  attendingKeys?: ReadonlySet<string>
  className?: string
}) {
  const labels = lang === "ja" ? DAY_LABELS_JA : DAY_LABELS_EN
  const t = TRANSLATIONS[lang]
  const isToday = today ?? ""
  const nowInstant = now ? instantFromSourceKey(now, sourceTimeZone()) : null
  const isPast = (event: CalendarEvent) => nowInstant !== null && nowInstant > event.endInstant
  const isAttending = (event: CalendarEvent) =>
    !isPast(event) && !event.archivePath &&
    event.attendanceKey !== undefined && attendingKeys?.has(event.attendanceKey) === true
  const [selectedCategories, setSelectedCategories] = useState<ActivityCategory[]>([])
  const activitiesById = useMemo(
    () => new Map(activities.map((activity) => [activity.id, activity])),
    [activities]
  )
  const categories = useMemo(() => {
    const available = new Set<ActivityCategory>()
    for (const { weeks } of months) {
      for (const week of weeks) {
        for (const day of week) {
          for (const event of day.events) {
            const category = activitiesById.get(event.activityId)?.category
            if (category) available.add(category)
          }
        }
      }
    }
    return ACTIVITY_CATEGORY_ORDER.filter((category) => available.has(category))
  }, [months, activitiesById])
  const activeCategories = selectedCategories.filter((category) => categories.includes(category))
  const isFiltered = activeCategories.length > 0
  const visibleWeeks = isFiltered
    ? month.weeks.map((week) => week.map((day) => ({
        ...day,
        events: day.events.filter((event) => {
          const category = activitiesById.get(event.activityId)?.category
          return category !== undefined && activeCategories.includes(category)
        }),
      })))
    : month.weeks
  const noMatches = isFiltered && !visibleWeeks.some((week) =>
    week.some((day) => day.events.length > 0))

  function toggleCategory(category: ActivityCategory | null) {
    setSelectedCategories((previous) => {
      if (category === null) return []
      const available = previous.filter((item) => categories.includes(item))
      return available.includes(category)
        ? available.filter((item) => item !== category)
        : [...available, category]
    })
  }

  return (
    <div className={`border grid-line rounded bg-white dark:bg-neutral-900 ${className}`}>
      <div className="flex items-center justify-between p-4">
        <button
          onClick={onPrev}
          disabled={!hasPrev}
          className="p-1 rounded hover:bg-coco-accent/10 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
          aria-label={lang === "ja" ? "前の月" : "Previous month"}
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
            {months.map(({ key: monthKey }) => (
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
          aria-label={lang === "ja" ? "次の月" : "Next month"}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      {categories.length > 1 && (
        <div role="group" aria-label={t.calendar_filter_categories}
          className="flex flex-wrap gap-1.5 border-t grid-line px-3 py-2.5">
          {([null, ...categories] as const).map((category) => {
            const selected = category === null ? !isFiltered : activeCategories.includes(category)
            const label = category ? ACTIVITY_CATEGORY_META[category].compactLabel[lang] : t.calendar_filter_all
            return (
              <button key={category ?? "all"} type="button" aria-pressed={selected}
                onClick={() => toggleCategory(category)}
                className={`min-h-9 rounded-full border px-3 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coco-accent ${selected
                  ? "border-coco-accent bg-coco-accent text-white"
                  : "grid-line text-coco-ink/70 hover:border-coco-accent hover:text-coco-accent"}`}>
                {label}
              </button>
            )
          })}
        </div>
      )}
      <div role="status" className={noMatches
        ? "border-t grid-line px-4 py-2 text-sm text-coco-ink/60"
        : "sr-only"}>
        {noMatches ? t.calendar_filter_no_matches : ""}
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

        {visibleWeeks.map((week, weekIndex) => {
          const weekHasEvents = week.some((day) => day.events.length > 0)
          const showTodayWithoutEvents = !isFiltered && week.some((day) => day.date === isToday)

          return (
            <section key={weekIndex} className="border-t grid-line first:border-t-0">
              <div className="grid grid-cols-7">
                {week.map((day, dayIndex) => {
                  const isTodayDay = day.date === isToday
                  const hasAttendance = day.events.some(isAttending)
                  const dotColor = hasAttendance ? "bg-violet-500"
                    : day.events.every(isPast) ? "bg-coco-ink/30" : "bg-coco-accent"

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
                            aria-current={isTodayDay ? "date" : undefined}
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
                              className={`mt-1 block h-1.5 w-1.5 rounded-full ${dotColor}`}
                              aria-label={hasAttendance ? t.attendance_saved : lang === "ja" ? "活動あり" : "Has events"}
                            />
                          )}
                        </>
                      )}
                    </div>
                  )
                })}
              </div>

              {(weekHasEvents || showTodayWithoutEvents) && (
                <div className="space-y-3 border-t grid-line bg-coco-ink/[0.0125] px-2 py-3">
                  {week.map((day, dayIndex) => {
                    const isTodayDay = day.date === isToday
                    if (day.dayNumber === null ||
                        (day.events.length === 0 && !(isTodayDay && showTodayWithoutEvents))) {
                      return null
                    }

                    return (
                      <div
                        key={dayIndex}
                        className="grid grid-cols-[2.75rem_minmax(0,1fr)] gap-2"
                      >
                        <div className="flex flex-col items-center pt-1.5 text-center">
                          <time
                            dateTime={day.date ?? undefined}
                            aria-current={isTodayDay ? "date" : undefined}
                            className={`flex h-8 w-8 items-center justify-center rounded-full text-sm ${
                              isTodayDay
                                ? "bg-coco-accent font-bold text-white"
                                : "font-medium text-coco-ink/70"
                            }`}
                          >
                            {day.dayNumber}
                          </time>
                          {isTodayDay && (
                            <span className="mt-1 text-[10px] font-bold leading-4 text-coco-accent">
                              {t.calendar_today}
                            </span>
                          )}
                          <div className="mt-0.5 text-[10px] leading-4 text-coco-ink/50">
                            {lang === "ja"
                              ? DAY_LABELS_JA[dayIndex]
                              : DAY_LABELS_EN[dayIndex]}
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          {isTodayDay && day.events.length === 0 && !isFiltered && (
                            <p className="flex min-h-16 items-center rounded border border-dashed border-coco-ink/15 px-3 py-2.5 text-sm text-coco-ink/55">
                              {t.calendar_no_events_today}
                            </p>
                          )}
                          {day.events.map((event, eventIndex) => {
                            const activity = activitiesById.get(event.activityId)
                            if (!activity) return null

                            return (
                              <CalendarEventCard
                                key={`${event.activityId}-${
                                  event.performanceIndex ?? eventIndex
                                }`}
                                event={event}
                                activity={activity}
                                lang={lang}
                                isPast={isPast(event)}
                                layout="mobile"
                                attending={isAttending(event)}
                                onSelect={onSelectEvent}
                                actionLabel={eventActionLabel}
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
            {visibleWeeks.flat().map((day, i) => {
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
                            const activity = activitiesById.get(event.activityId)
                            if (!activity) return null

                            return (
                              <CalendarEventCard
                                key={`${event.activityId}-${
                                  event.performanceIndex ?? eventIndex
                                }`}
                                event={event}
                                activity={activity}
                                lang={lang}
                                isPast={isPast(event)}
                                layout="desktop"
                                attending={isAttending(event)}
                                onSelect={onSelectEvent}
                                actionLabel={eventActionLabel}
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
