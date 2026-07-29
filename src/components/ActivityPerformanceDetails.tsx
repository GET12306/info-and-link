import { CalendarClock, ChevronDown } from "lucide-react"
import { TRANSLATIONS } from "../i18n"
import type { ActivityPerformance, Language } from "../types"
import { getValidActivityPerformances } from "../utils/activityPerformances"
import {
  getJapanTimeLabel,
  normalizeJapanDateTimeKey,
} from "../utils/japanTime"

const JAPAN_TIME_ZONE = "Asia/Tokyo"
const DATE_TIME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/

interface DisplayPerformance {
  date: string
  startAt: string
  endAt?: string
  label?: string
}

function getDisplayPerformances(
  performances: ActivityPerformance[] | undefined,
  lang: Language
) {
  return getValidActivityPerformances(performances)
    .map((performance): DisplayPerformance | null => {
      const startAt = normalizeJapanDateTimeKey(performance.startAt)
      if (!DATE_TIME_PATTERN.test(startAt)) return null

      const normalizedEndAt = performance.endAt
        ? normalizeJapanDateTimeKey(performance.endAt, "end")
        : undefined

      return {
        date: startAt.substring(0, 10),
        startAt,
        endAt:
          normalizedEndAt && DATE_TIME_PATTERN.test(normalizedEndAt)
            ? normalizedEndAt
            : undefined,
        label: performance.label?.[lang],
      }
    })
    .filter((performance): performance is DisplayPerformance =>
      Boolean(performance)
    )
    .sort((a, b) => a.startAt.localeCompare(b.startAt))
}

function formatDate(date: string, lang: Language) {
  const value = new Date(`${date}T12:00:00+09:00`)
  if (Number.isNaN(value.getTime())) return date

  return new Intl.DateTimeFormat(lang === "ja" ? "ja-JP" : "en-US", {
    timeZone: JAPAN_TIME_ZONE,
    year: "numeric",
    month: lang === "ja" ? "numeric" : "short",
    day: "numeric",
    weekday: "short",
  }).format(value)
}

function formatTimeRange(
  performance: DisplayPerformance,
  lang: Language
) {
  const startTime = getJapanTimeLabel(performance.startAt)
  if (!performance.endAt) return startTime

  const endDate = performance.endAt.substring(0, 10)
  const endTime = getJapanTimeLabel(performance.endAt)
  if (endDate === performance.date) return `${startTime}–${endTime}`

  return `${startTime} - ${formatDate(endDate, lang)} ${endTime}`
}

export default function ActivityPerformanceDetails({
  performances,
  lang,
}: {
  performances?: ActivityPerformance[]
  lang: Language
}) {
  const t = TRANSLATIONS[lang]
  const displayPerformances = getDisplayPerformances(performances, lang)
  if (displayPerformances.length === 0) return null

  const performancesByDate = displayPerformances.reduce<
    Array<[string, DisplayPerformance[]]>
  >((groups, performance) => {
    const currentGroup = groups[groups.length - 1]
    if (currentGroup?.[0] === performance.date) {
      currentGroup[1].push(performance)
    } else {
      groups.push([performance.date, [performance]])
    }
    return groups
  }, [])

  return (
    <details className="group mt-4">
      <summary className="inline-flex cursor-pointer list-none items-center gap-2 rounded-full border grid-line px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-coco-ink/50 transition-colors hover:border-coco-accent hover:text-coco-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coco-accent [&::-webkit-details-marker]:hidden">
        <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
        <span>{t.performance_schedule}</span>
        <span className="rounded-full bg-coco-ink/5 px-1.5 py-0.5 text-[9px] leading-none">
          {displayPerformances.length}
        </span>
        <ChevronDown
          className="h-3.5 w-3.5 transition-transform group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>

      <div className="mt-3 overflow-hidden rounded border grid-line bg-coco-ink/2.5 dark:bg-white/2.5">
        {performancesByDate.map(([date, datePerformances]) => (
          <div
            key={date}
            className="grid gap-2 border-b grid-line px-4 py-3 last:border-b-0 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-5"
          >
            <time
              dateTime={date}
              className="text-sm leading-6 text-coco-ink/60"
            >
              {formatDate(date, lang)}
            </time>
            <ul className="space-y-1.5">
              {datePerformances.map((performance) => (
                <li
                  key={`${performance.startAt}-${performance.label ?? ""}`}
                  className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5"
                >
                  <time
                    dateTime={performance.startAt}
                    className="text-sm leading-6 text-coco-ink/60"
                  >
                    {formatTimeRange(performance, lang)}
                  </time>
                  {performance.label && (
                    <span className="text-xs text-coco-ink/55">
                      {performance.label}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </details>
  )
}
