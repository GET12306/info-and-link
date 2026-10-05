import { isCalendarDate, isCalendarDateTime, isClockTime } from "./contentValidation"
import { eachDayOfInterval, format, getDay, parseISO } from "date-fns"
import type {
  Activity,
  ActivityMilestone,
  ActivityPerformance,
  ActivityWeekday,
  LocalizedText,
  WeeklyActivityRecurrence,
} from "../types"
import { getValidActivityMilestones } from "./activityMilestones"
import {
  normalizeJapanDateTimeKey,
} from "./japanTime"
import { dateTimeInZone, instantFromSourceKey, sourceTimeZone } from "./timeZone"

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

export interface ActivityOccurrence {
  date: string
  startAt?: string
  endAt: string
  allDay: boolean
  performanceIndex?: number
  label?: LocalizedText
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

function getWeeklyRecurrenceOccurrences(
  recurrence: WeeklyActivityRecurrence,
  durationMinutes?: number,
  timeZone = sourceTimeZone()
) {
  const start = normalizeDate(recurrence.startOn)
  const end = normalizeDate(recurrence.endOn)
  const weekday = WEEKDAY_INDEX[recurrence.weekday]
  if (!start || !end || end < start || weekday === undefined ||
      !isClockTime(recurrence.startTime)) return []

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

  const generatedPerformances: ActivityPerformance[] = []
  for (const date of scheduledDates) {
    const override = overrides.get(date)
    if (override?.cancelled) continue
    generatedPerformances.push({
      startAt: `${date}T${override?.startTime ?? recurrence.startTime}`,
    })
  }
  const occurrences = getPerformanceOccurrences(generatedPerformances, durationMinutes, timeZone)
  return occurrences.length === generatedPerformances.length ? occurrences : []
}

export function getActivityOccurrences(activity: Activity) {
  if (activity.recurrence?.type === "weekly") {
    return getWeeklyRecurrenceOccurrences(
      activity.recurrence,
      activity.durationMinutes,
      sourceTimeZone(activity.timeZone)
    )
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
