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
  addMinutesToJapanDateTimeKey,
  normalizeJapanDateTimeKey,
} from "./japanTime"

export const DEFAULT_ACTIVITY_DURATION_MINUTES = 90

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const DATE_TIME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/
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
}

function normalizeDate(value: unknown) {
  if (typeof value !== "string") return null
  const normalized = value.trim()
  if (!DATE_PATTERN.test(normalized)) return null

  const [year, month, day] = normalized.split("-").map(Number)
  const parsed = new Date(Date.UTC(year, month - 1, day))
  return parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
    ? normalized
    : null
}

function normalizeDateTime(value: unknown, boundary: "start" | "end" = "start") {
  if (typeof value !== "string") return null
  const normalized = normalizeJapanDateTimeKey(value, boundary)
  if (!DATE_TIME_PATTERN.test(normalized)) return null

  const date = normalizeDate(normalized.substring(0, 10))
  const hour = Number(normalized.substring(11, 13))
  const minute = Number(normalized.substring(14, 16))
  return date && hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59
    ? normalized
    : null
}

export function getPerformanceOccurrences(
  performances: ActivityPerformance[] | undefined,
  durationMinutes?: number
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
        return {
          date,
          endAt: normalizeJapanDateTimeKey(date, "end"),
          allDay: true,
          performanceIndex,
          label: performance.label,
          milestones: getValidActivityMilestones(performance.milestones),
          showEndAt: false,
        }
      }

      const startAt = normalizeDateTime(performance.startAt)
      if (!startAt) return null
      const explicitEndAt = normalizeDateTime(performance.endAt, "end")

      return {
        date: startAt.substring(0, 10),
        startAt,
        endAt:
          explicitEndAt ?? addMinutesToJapanDateTimeKey(startAt, safeDuration),
        allDay: false,
        performanceIndex,
        label: performance.label,
        milestones: getValidActivityMilestones(performance.milestones),
        showEndAt: Boolean(explicitEndAt || configuredDuration),
      }
    })
    .filter((occurrence): occurrence is ActivityOccurrence => Boolean(occurrence))
    .sort((a, b) =>
      (a.startAt ?? `${a.date}T00:00`).localeCompare(
        b.startAt ?? `${b.date}T00:00`
      )
    )
}

function getDateRangeOccurrences(startDate?: string, endDate?: string) {
  const start = normalizeDate(startDate)
  if (!start) return []
  const end = normalizeDate(endDate) ?? start
  const safeEnd = end >= start ? end : start

  return eachDayOfInterval({ start: parseISO(start), end: parseISO(safeEnd) }).map(
    (day): ActivityOccurrence => {
      const date = format(day, "yyyy-MM-dd")
      return {
        date,
        endAt: normalizeJapanDateTimeKey(date, "end"),
        allDay: true,
        milestones: [],
        showEndAt: false,
      }
    }
  )
}

function getWeeklyRecurrenceOccurrences(
  recurrence: WeeklyActivityRecurrence,
  durationMinutes?: number
) {
  const start = normalizeDate(recurrence.startOn)
  const end = normalizeDate(recurrence.endOn)
  const weekday = WEEKDAY_INDEX[recurrence.weekday]
  if (!start || !end || end < start || weekday === undefined ||
      !TIME_PATTERN.test(recurrence.startTime)) return []

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
      (typeof override.startTime !== "string" || !TIME_PATTERN.test(override.startTime)))
  )) return []

  const generatedPerformances: ActivityPerformance[] = []
  for (const date of scheduledDates) {
    const override = overrides.get(date)
    if (override?.cancelled) continue
    generatedPerformances.push({
      startAt: `${date}T${override?.startTime ?? recurrence.startTime}`,
    })
  }
  return getPerformanceOccurrences(generatedPerformances, durationMinutes)
}

export function getActivityOccurrences(activity: Activity) {
  if (activity.recurrence?.type === "weekly") {
    return getWeeklyRecurrenceOccurrences(
      activity.recurrence,
      activity.durationMinutes
    )
  }
  const performanceOccurrences = getPerformanceOccurrences(
    activity.performances,
    activity.durationMinutes
  )
  return performanceOccurrences.length
    ? performanceOccurrences
    : getDateRangeOccurrences(activity.startDate, activity.endDate)
}

export function getNextActivityOccurrence(activity: Activity, now: string) {
  const today = normalizeJapanDateTimeKey(now).substring(0, 10)
  return getActivityOccurrences(activity).find(
    (occurrence) => occurrence.date >= today
  ) ?? null
}
