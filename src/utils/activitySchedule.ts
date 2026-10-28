import { isCalendarDate, isCalendarDateTime, isClockTime } from "./contentValidation"
import { eachDayOfInterval, format, getDay, parseISO } from "date-fns"
import type {
  Activity,
  ActivityMilestone,
  ActivityPerformance,
  ActivityPerformanceDetails,
  ActivityWeekday,
} from "../types"
import { getValidActivityMilestones } from "./activityMilestones"
import {
  normalizeJapanDateTimeKey,
} from "./japanTime"
import { dateTimeInZone, instantFromSourceKey, sourceTimeZone } from "./timeZone"
import { getMonthlyPerformances } from "./monthlySchedule"

export const DEFAULT_ACTIVITY_DURATION_MINUTES = 90

const WEEKDAY_INDEX: Record<ActivityWeekday, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
}

export interface ActivityOccurrence extends ActivityPerformanceDetails {
  date: string
  startAt?: string
  endAt: string
  allDay: boolean
  performanceIndex?: number
  milestones: ActivityMilestone[]
  showEndAt: boolean
  timeZone: string
  startInstant: number
  endInstant: number
}

function normalizeDate(value: unknown) {
  if (typeof value !== "string") return null
  const normalized = value.trim()
  return isCalendarDate(normalized) ? normalized : null
}

function normalizeDateTime(value: unknown, boundary: "start" | "end" = "start") {
  if (typeof value !== "string") return null
  const normalized = normalizeJapanDateTimeKey(value, boundary)
  return isCalendarDateTime(normalized) ? normalized : null
}

export function getPerformanceOccurrences(
  performances: ActivityPerformance[] | undefined,
  durationMinutes?: number,
  timeZone = sourceTimeZone()
) {
  const configuredDuration =
    typeof durationMinutes === "number" &&
    Number.isFinite(durationMinutes) &&
    durationMinutes > 0
      ? durationMinutes
      : null
  const safeDuration =
    configuredDuration ?? DEFAULT_ACTIVITY_DURATION_MINUTES

  return (performances ?? [])
    .map((performance, performanceIndex): ActivityOccurrence | null => {
      if (!performance) return null

      if ("occursOn" in performance) {
        const date = normalizeDate(performance.occursOn)
        if (!date) return null
        const startInstant = instantFromSourceKey(date, timeZone)
        const endInstant = instantFromSourceKey(date, timeZone, "end")
        if (startInstant === null || endInstant === null) return null
        return {
          ...performance,
          date,
          endAt: normalizeJapanDateTimeKey(date, "end"),
          allDay: true,
          performanceIndex,
          label: performance.label,
          milestones: getValidActivityMilestones(performance.milestones),
          showEndAt: false,
          timeZone, startInstant, endInstant,
        }
      }

      const startAt = normalizeDateTime(performance.startAt)
      if (!startAt) return null
      const startInstant = instantFromSourceKey(startAt, timeZone)
      if (startInstant === null) return null
      const explicitEndAt = normalizeDateTime(performance.endAt, "end")
      const endInstant = explicitEndAt
        ? instantFromSourceKey(explicitEndAt, timeZone)
        : startInstant + safeDuration * 60_000
      if (endInstant === null || endInstant <= startInstant) return null

      return {
        ...performance,
        date: startAt.substring(0, 10),
        startAt,
        endAt: explicitEndAt ?? dateTimeInZone(endInstant, timeZone),
        allDay: false,
        performanceIndex,
        label: performance.label,
        milestones: getValidActivityMilestones(performance.milestones),
        showEndAt: Boolean(explicitEndAt || configuredDuration),
        timeZone, startInstant, endInstant,
      }
    })
    .filter((occurrence): occurrence is ActivityOccurrence => Boolean(occurrence))
    .sort((a, b) => a.startInstant - b.startInstant)
}

function getDateRangeOccurrences(startDate?: string, endDate?: string, timeZone = sourceTimeZone()) {
  const start = normalizeDate(startDate)
  if (!start) return []
  const end = normalizeDate(endDate) ?? start
  const safeEnd = end >= start ? end : start

  return eachDayOfInterval({ start: parseISO(start), end: parseISO(safeEnd) }).map(
    (day): ActivityOccurrence => {
      const date = format(day, "yyyy-MM-dd")
      const startInstant = instantFromSourceKey(date, timeZone)!
      const endInstant = instantFromSourceKey(date, timeZone, "end")!
      return {
        date,
        endAt: normalizeJapanDateTimeKey(date, "end"),
        allDay: true,
        milestones: [],
        showEndAt: false,
        timeZone, startInstant, endInstant,
      }
    }
  )
}

/** Weekly rules and per-episode metadata share the ordinary performances model. */
export function getWeeklyPerformances(activity: Activity): ActivityPerformance[] {
  if (activity.recurrence?.type !== "weekly") return []
  const recurrence = activity.recurrence
  const start = normalizeDate(recurrence.startOn)
  const end = normalizeDate(recurrence.endOn)
  const weekday = WEEKDAY_INDEX[recurrence.weekday]
  if (!start || !end || end < start || weekday === undefined ||
      !isClockTime(recurrence.startTime) ||
      (recurrence.firstEpisode !== undefined && (!Number.isInteger(recurrence.firstEpisode) || recurrence.firstEpisode < 0))) return []

  if (recurrence.overrides !== undefined && !Array.isArray(recurrence.overrides)) {
    return []
  }
  const overrideList = recurrence.overrides ?? []
  if (overrideList.some((override) => !override || typeof override !== "object" ||
      typeof override.date !== "string")) return []
  const overrides = new Map(
    overrideList.map((override) => [override.date, override])
  )
  if (overrides.size !== overrideList.length) return []

  const scheduledDates = eachDayOfInterval({
    start: parseISO(start),
    end: parseISO(end),
  })
    .filter((day) => getDay(day) === weekday)
    .map((day) => format(day, "yyyy-MM-dd"))

  if (overrideList.some((override) =>
    !scheduledDates.includes(override.date) ||
    (override.cancelled !== undefined && typeof override.cancelled !== "boolean") ||
    (override.cancelled && override.startTime !== undefined) ||
    (override.startTime !== undefined &&
      (typeof override.startTime !== "string" || !isClockTime(override.startTime)))
  )) return []

  if (activity.performances !== undefined && !Array.isArray(activity.performances)) return []
  const manual = activity.performances ?? []
  const manualDates = new Set<string>()
  for (const performance of manual) {
    if (!performance || typeof performance !== "object") return []
    const key = performance.startAt ?? performance.occursOn
    if (typeof key !== "string") return []
    const date = key.slice(0, 10)
    if (manualDates.has(date)) return []
    manualDates.add(date)
    if (scheduledDates.includes(date)) {
      const override = overrides.get(date)
      if (override?.cancelled || !isCalendarDateTime(performance.startAt)) return []
    }
  }
  const consumed = new Set<ActivityPerformance>()
  const generatedPerformances: ActivityPerformance[] = []
  for (const [index, date] of scheduledDates.entries()) {
    const saved = manual.find(item => (item.startAt ?? item.occursOn)?.slice(0, 10) === date)
    if (saved) consumed.add(saved)
    const override = overrides.get(date)
    if (override?.cancelled) continue
    const { occursOn: _occursOn, ...details } = saved ?? {}
    generatedPerformances.push({
      ...details,
      startAt: override?.startTime ? `${date}T${override.startTime}` : saved?.startAt ?? `${date}T${recurrence.startTime}`,
      ...(saved?.episode !== undefined ? { episode: saved.episode }
        : recurrence.firstEpisode !== undefined ? { episode: String(recurrence.firstEpisode + index) } : {}),
    })
  }
  generatedPerformances.push(...manual.filter(item => !consumed.has(item)))
  return generatedPerformances
}

export function getActivityOccurrences(activity: Activity, through?: string) {
  if (activity.recurrence?.type === "monthly") {
    return getPerformanceOccurrences(getMonthlyPerformances(activity, through), activity.durationMinutes, sourceTimeZone(activity.timeZone))
  }
  if (activity.recurrence?.type === "weekly") {
    const performances = getWeeklyPerformances(activity)
    const occurrences = getPerformanceOccurrences(performances, activity.durationMinutes, sourceTimeZone(activity.timeZone))
    return occurrences.length === performances.length ? occurrences : []
  }
  const performanceOccurrences = getPerformanceOccurrences(
    activity.performances,
    activity.durationMinutes,
    sourceTimeZone(activity.timeZone)
  )
  return performanceOccurrences.length
    ? performanceOccurrences
    : getDateRangeOccurrences(activity.startDate, activity.endDate, sourceTimeZone(activity.timeZone))
}

export function getNextActivityOccurrence(activity: Activity, now: string) {
  const nowInstant = instantFromSourceKey(now, sourceTimeZone()) ?? Date.now()
  const today = dateTimeInZone(nowInstant, sourceTimeZone(activity.timeZone)).substring(0, 10)
  return getActivityOccurrences(activity).find(
    (occurrence) => occurrence.date >= today
  ) ?? null
}
