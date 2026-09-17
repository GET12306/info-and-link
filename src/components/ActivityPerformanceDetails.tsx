import { CalendarClock, ChevronDown } from "lucide-react"
import { useId, useState, type ReactNode } from "react"
import { TRANSLATIONS } from "../i18n"
import type {
  ActivityMilestone,
  ActivityPerformance,
  Language,
} from "../types"
import { getPerformanceOccurrences, type ActivityOccurrence } from "../utils/activitySchedule"
import { getJapanTimeLabel } from "../utils/japanTime"
import {
  getActivityMilestoneLabel,
  getActivityMilestoneTime,
} from "../utils/activityMilestones"

const JAPAN_TIME_ZONE = "Asia/Tokyo"
interface DisplayPerformance {
  occurrence: ActivityOccurrence
  date: string
  startAt?: string
  endAt?: string
  label?: string
  milestones: ActivityMilestone[]
}

function getDisplayPerformances(occurrences: ActivityOccurrence[], lang: Language) {
  return occurrences.map((occurrence): DisplayPerformance => ({
    occurrence,
    date: occurrence.date,
    startAt: occurrence.startAt,
    endAt: occurrence.showEndAt ? occurrence.endAt : undefined,
    label: occurrence.label?.[lang],
    milestones: occurrence.milestones,
  }))
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
  if (!performance.startAt) {
    return lang === "ja" ? "時間未定" : "Time TBA"
  }
  const startTime = getJapanTimeLabel(performance.startAt)
  if (!performance.endAt) return startTime

  const endDate = performance.endAt.substring(0, 10)
  const endTime = getJapanTimeLabel(performance.endAt)
  if (endDate === performance.date) return `${startTime}–${endTime}`

  return `${startTime} - ${formatDate(endDate, lang)} ${endTime}`
}

function getTimeItems(
  performance: DisplayPerformance,
  lang: Language,
  startLabel?: string
) {
  const t = TRANSLATIONS[lang]
  return [
    ...performance.milestones.map((milestone) => ({
      at: milestone.at,
      dateTime: `${performance.date}T${milestone.at}`,
      time: getActivityMilestoneTime(milestone),
      label: getActivityMilestoneLabel(milestone, lang),
    })),
    ...(performance.startAt
      ? [
          {
            at: getJapanTimeLabel(performance.startAt),
            dateTime: performance.startAt,
            time: formatTimeRange(performance, lang),
            label: startLabel ?? t.milestone_start,
          },
        ]
      : []),
  ].sort((a, b) => a.at.localeCompare(b.at))
}

export default function ActivityPerformanceDetails({
  performances,
  durationMinutes,
  lang,
  actions,
  toolbarPanel,
  renderPerformanceAction,
  footer,
  occurrences,
  startLabel,
  inlineLabel,
  emptyLabel,
}: {
  performances?: ActivityPerformance[]
  durationMinutes?: number
  lang: Language
  actions?: ReactNode
  toolbarPanel?: ReactNode
  renderPerformanceAction?: (occurrence: ActivityOccurrence) => ReactNode
  footer?: ReactNode
  occurrences?: ActivityOccurrence[]
  startLabel?: string
  inlineLabel?: string
  emptyLabel?: string
}) {
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const t = TRANSLATIONS[lang]
  const displayPerformances = getDisplayPerformances(
    occurrences ?? getPerformanceOccurrences(performances, durationMinutes),
    lang
  )

  if (inlineLabel) {
    const performance = displayPerformances[0]
    if (!performance) {
      return <>
        {emptyLabel && (
          <div className="mt-4 text-sm leading-6 text-coco-ink/50">
            {emptyLabel}
          </div>
        )}
        {footer}
      </>
    }

    const updateMilestone = performance.milestones.find(
      (milestone) => milestone.kind === "update"
    )
    const updateTime = updateMilestone
      ? {
          dateTime: `${performance.date}T${updateMilestone.at}`,
          label: getActivityMilestoneTime(updateMilestone),
        }
      : performance.startAt
        ? {
            dateTime: performance.startAt,
            label: getJapanTimeLabel(performance.startAt),
          }
        : null

    return (
      <div className="mt-4">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm leading-6 text-coco-ink/50">
          <span>{inlineLabel}{lang === "ja" ? "：" : ":"}</span>
          <time dateTime={performance.date} className="text-coco-ink/65">
            {formatDate(performance.date, lang)}
          </time>
          {updateTime && (
            <time dateTime={updateTime.dateTime} className="text-coco-ink/65">
              {updateTime.label}
            </time>
          )}
          {actions}
          {renderPerformanceAction?.(performance.occurrence)}
        </div>
        {toolbarPanel}
        {footer}
      </div>
    )
  }

  if (displayPerformances.length === 0) {
    return <>{footer}</>
  }

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
    <div className="mt-4">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" aria-expanded={open} aria-controls={panelId} aria-label={t.performance_schedule} onClick={() => setOpen(!open)} className="inline-flex min-h-9 shrink-0 cursor-pointer items-center gap-2 rounded-full border grid-line px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-coco-ink/50 transition-colors hover:border-coco-accent hover:text-coco-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coco-accent">
          <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="sm:hidden">{t.performance_schedule_short}</span>
          <span className="hidden sm:inline">{t.performance_schedule}</span>
          <span className="rounded-full bg-coco-ink/5 px-1.5 py-0.5 text-[9px] leading-none">
            {displayPerformances.length}
          </span>
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </button>
        {actions}
      </div>
      {toolbarPanel}

      <div id={panelId} hidden={!open} className="mt-3 overflow-hidden rounded border grid-line bg-coco-ink/2.5 dark:bg-white/2.5">
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
              {datePerformances.map((performance) => {
                const timeItems = getTimeItems(performance, lang, startLabel)
                return (
                  <li
                    key={`${performance.startAt ?? performance.date}-${performance.label ?? ""}`}
                    className="flex flex-wrap items-start justify-between gap-2 border-b grid-line py-2 first:pt-0 last:border-b-0 last:pb-0"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      {performance.label && (
                        <span className="block text-xs font-medium text-coco-ink/65">
                          {performance.label}
                        </span>
                      )}
                      <div className="flex flex-wrap gap-x-4 gap-y-1">
                        {timeItems.map((item) => (
                          <span
                            key={`${item.dateTime}-${item.label}`}
                            className="inline-flex items-baseline gap-1.5"
                          >
                            <span className="text-xs text-coco-ink/45">
                              {item.label}
                            </span>
                            <time
                              dateTime={item.dateTime}
                              className="text-sm leading-6 text-coco-ink/65"
                            >
                              {item.time}
                            </time>
                          </span>
                        ))}
                        {timeItems.length === 0 && (
                          <span className="text-sm leading-6 text-coco-ink/60">
                            {formatTimeRange(performance, lang)}
                          </span>
                        )}
                      </div>
                    </div>
                    {renderPerformanceAction?.(performance.occurrence)}
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>
      {footer}
    </div>
  )
}
