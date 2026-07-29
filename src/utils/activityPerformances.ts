import type { ActivityPerformance } from "../types"
import {
  addMinutesToJapanDateTimeKey,
  normalizeJapanDateTimeKey,
} from "./japanTime"

export const DEFAULT_ACTIVITY_DURATION_MINUTES = 60

export function getValidActivityPerformances(
  performances?: ActivityPerformance[]
) {
  return (performances ?? []).filter(
    (performance) =>
      performance &&
      typeof performance.startAt === "string" &&
      performance.startAt.trim().length > 0
  )
}

export function getPerformanceStartAt(performance: ActivityPerformance) {
  return normalizeJapanDateTimeKey(performance.startAt)
}

export function getPerformanceEndAt(performance: ActivityPerformance) {
  if (typeof performance.endAt === "string" && performance.endAt.trim()) {
    return normalizeJapanDateTimeKey(performance.endAt, "end")
  }
  return addMinutesToJapanDateTimeKey(
    performance.startAt,
    DEFAULT_ACTIVITY_DURATION_MINUTES
  )
}
