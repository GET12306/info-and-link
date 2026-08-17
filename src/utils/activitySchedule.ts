import { eachDayOfInterval, format, parseISO } from "date-fns"
import type { Activity, ActivityPerformance, LocalizedText } from "../types"
import {
  addMinutesToJapanDateTimeKey,
  normalizeJapanDateTimeKey,
} from "./japanTime"

export const DEFAULT_ACTIVITY_DURATION_MINUTES = 60

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const DATE_TIME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/

export interface ActivityOccurrence {
  date: string
  startAt?: string
  endAt: string
  allDay: boolean
  performanceIndex?: number
  label?: LocalizedText
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
        showEndAt: false,
      }
    }
  )
}

export function getActivityOccurrences(activity: Activity) {
  const performanceOccurrences = getPerformanceOccurrences(
    activity.performances,
    activity.durationMinutes
  )
  return performanceOccurrences.length
    ? performanceOccurrences
    : getDateRangeOccurrences(activity.startDate, activity.endDate)
}
