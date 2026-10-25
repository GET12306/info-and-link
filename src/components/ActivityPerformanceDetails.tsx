import { CalendarClock } from "lucide-react"
import { useId, useState, type ReactNode } from "react"
import { TRANSLATIONS } from "../i18n"
import type {
  ActivityMilestone,
  ActivityPerformance,
  Language,
} from "../types"
import { getPerformanceOccurrences, type ActivityOccurrence } from "../utils/activitySchedule"
import { dateTimeForViewer, instantFromSourceKey, sourceTimeZone, viewerTimeZone } from "../utils/timeZone"
import {
  getActivityMilestoneLabel,
  getActivityMilestoneTime,
} from "../utils/activityMilestones"
import { CatalogDisclosure } from "./ArchiveCatalog"
import ActivityDisclosureButton from "./ActivityDisclosureButton"
import ExternalAnchor from "./ExternalAnchor"
import ExpiredLinkBadge from "./ExpiredLinkBadge"
import { isHttpUrl } from "../utils/contentValidation"

interface DisplayPerformance {
  occurrence: ActivityOccurrence
  date: string
  startAt?: string
  endAt?: string
  label?: string
  milestones: ActivityMilestone[]
}

function getDisplayPerformances(occurrences: ActivityOccurrence[], lang: Language, timeZone: string) {
  return occurrences.map((occurrence): DisplayPerformance => ({
    occurrence,
    date: occurrence.allDay ? occurrence.date : dateTimeForViewer(occurrence.startInstant, timeZone).substring(0, 10),
    startAt: occurrence.startAt ? dateTimeForViewer(occurrence.startInstant, timeZone) : undefined,
    endAt: occurrence.showEndAt ? dateTimeForViewer(occurrence.endInstant, timeZone) : undefined,
    label: occurrence.label?.[lang] ?? (occurrence.episode ? TRANSLATIONS[lang].program_episode_number.replace("{episode}", occurrence.episode) : undefined),
    milestones: occurrence.milestones.map((milestone) => {
      const start = instantFromSourceKey(`${occurrence.date}T${milestone.at}`, occurrence.timeZone)
      const end = milestone.until ? instantFromSourceKey(`${occurrence.date}T${milestone.until}`, occurrence.timeZone) : null
      return start === null ? milestone : {
        ...milestone,
        at: dateTimeForViewer(start, timeZone).substring(11),
        until: end === null ? undefined : dateTimeForViewer(end, timeZone).substring(11),
      }
    }),
  })).sort((a, b) => a.occurrence.startInstant - b.occurrence.startInstant)
}

function formatDate(date: string, lang: Language) {
  const value = new Date(`${date}T12:00:00Z`)
  if (Number.isNaN(value.getTime())) return date

  return new Intl.DateTimeFormat(lang === "ja" ? "ja-JP" : "en-US", {
    timeZone: "UTC",
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
  const startTime = performance.startAt.substring(11)
  if (!performance.endAt) return startTime

  const endDate = performance.endAt.substring(0, 10)
  const endTime = performance.endAt.substring(11)
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
    ...performance.milestones.map((milestone, index) => {
      const instant = instantFromSourceKey(
        `${performance.occurrence.date}T${performance.occurrence.milestones[index].at}`,
        performance.occurrence.timeZone
      ) ?? performance.occurrence.startInstant
      const dateTime = dateTimeForViewer(instant)
      const datePrefix = dateTime.substring(0, 10) === performance.date
        ? "" : `${formatDate(dateTime.substring(0, 10), lang)} `
      return {
        at: dateTime,
        dateTime,
        time: `${datePrefix}${getActivityMilestoneTime(milestone)}`,
        label: getActivityMilestoneLabel(milestone, lang),
      }
    }),
    ...(performance.startAt
      ? [
          {
            at: performance.startAt,
            dateTime: performance.startAt,
            time: formatTimeRange(performance, lang),
            label: startLabel ?? t.milestone_start,
          },
        ]
      : []),
  ].sort((a, b) => a.at.localeCompare(b.at))
}

function PerformanceSchedulePanel({ displayPerformances, lang, startLabel, renderPerformanceAction }: {
  displayPerformances: DisplayPerformance[]
  lang: Language
  startLabel?: string
  renderPerformanceAction?: (occurrence: ActivityOccurrence) => ReactNode
}) {
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

  return <div className="overflow-hidden rounded border grid-line bg-coco-ink/2.5 dark:bg-white/2.5">
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
            const { link, status, description } = performance.occurrence
            return (
              <li
                key={`${performance.startAt ?? performance.date}-${performance.label ?? ""}`}
                className="flex flex-wrap items-start justify-between gap-2 border-b grid-line py-2 first:pt-0 last:border-b-0 last:pb-0"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  {link && status !== "expired" && isHttpUrl(link) ? (
                    <ExternalAnchor href={link} className="block text-xs font-medium text-coco-ink/65 transition-colors hover:text-coco-accent">
                      {performance.label ?? TRANSLATIONS[lang].performance_schedule}
                    </ExternalAnchor>
                  ) : performance.label && (
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
                  {description && <p className="break-words text-sm leading-6 text-coco-ink/60">{description[lang]}</p>}
                  {status === "expired" && <ExpiredLinkBadge lang={lang} />}
                </div>
                {renderPerformanceAction?.(performance.occurrence)}
              </li>
            )
          })}
        </ul>
      </div>
    ))}
  </div>
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
  compact = false,
  sourceZone,
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
  compact?: boolean
  sourceZone?: string
}) {
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const t = TRANSLATIONS[lang]
  const performanceOccurrences = occurrences ?? getPerformanceOccurrences(
    performances, durationMinutes, sourceTimeZone(sourceZone)
  )
  if (performanceOccurrences.length === 0) return <>{footer}</>

  const renderSchedulePanel = () => <PerformanceSchedulePanel
    displayPerformances={getDisplayPerformances(performanceOccurrences, lang, viewerTimeZone())}
    lang={lang}
    startLabel={startLabel}
    renderPerformanceAction={renderPerformanceAction}
  />

  if (compact) {
    return <>
      <CatalogDisclosure deferMount label={`${t.performance_schedule} (${performanceOccurrences.length})`}>
        {renderSchedulePanel}
      </CatalogDisclosure>
      {footer}
    </>
  }

  return (
    <div className="mt-4">
      <div className="flex flex-wrap items-center gap-2">
        <ActivityDisclosureButton
          label={t.performance_schedule}
          shortLabel={t.performance_schedule_short}
          icon={<CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />}
          count={performanceOccurrences.length}
          open={open}
          panelId={panelId}
          onClick={() => setOpen(!open)}
        />
        {actions}
      </div>
      {toolbarPanel}

      <div id={panelId} hidden={!open} className="mt-3">{renderSchedulePanel()}</div>
      {footer}
    </div>
  )
}
