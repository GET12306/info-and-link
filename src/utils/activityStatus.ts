import type { Activity } from "../types"
import {
  getJapanDateKey,
  getJapanDateTimeKey,
  normalizeJapanDateTimeKey,
} from "./japanTime"
import {
  getPerformanceEndAt,
  getPerformanceStartAt,
  getValidActivityPerformances,
} from "./activityPerformances"

export type ActivityStatus = "upcoming" | "ongoing" | "past"
export type IndexedActivity = Activity & { originalIndex: number }

export function getTodayKey(date = new Date()) {
  return getJapanDateKey(date)
}

export function getActivityEndDate(activity: Activity): string | null {
  const performances = getValidActivityPerformances(activity.performances)
  if (performances.length) {
    return performances
      .map((performance) => getPerformanceEndAt(performance).substring(0, 10))
      .sort()
      .at(-1) ?? null
  }
  if (activity.activeDates?.length) {
    return [...activity.activeDates].sort().at(-1) ?? null
  }
  return activity.endDate ?? activity.startDate ?? null
}

export function getActivityStartDate(activity: Activity): string | null {
  const performances = getValidActivityPerformances(activity.performances)
  if (performances.length) {
    return performances
      .map((performance) => getPerformanceStartAt(performance).substring(0, 10))
      .sort()[0] ?? null
  }
  if (activity.activeDates?.length) {
    return [...activity.activeDates].sort()[0] ?? null
  }
  return activity.startDate ?? null
}

function getActivityStartDateTime(activity: Activity) {
  const performances = getValidActivityPerformances(activity.performances)
  if (performances.length) {
    return performances
      .map(getPerformanceStartAt)
      .sort()[0] ?? null
  }
  if (activity.activeDates?.length) {
    return normalizeJapanDateTimeKey([...activity.activeDates].sort()[0])
  }
  return activity.startDate ? normalizeJapanDateTimeKey(activity.startDate) : null
}

function getActivityEndDateTime(activity: Activity) {
  const performances = getValidActivityPerformances(activity.performances)
  if (performances.length) {
    return performances
      .map(getPerformanceEndAt)
      .sort()
      .at(-1) ?? null
  }
  if (activity.activeDates?.length) {
    const lastDate = [...activity.activeDates].sort().at(-1)
    return lastDate ? normalizeJapanDateTimeKey(lastDate, "end") : null
  }
  const endDate = activity.endDate ?? activity.startDate
  return endDate ? normalizeJapanDateTimeKey(endDate, "end") : null
}

export function getActivityStatus(
  activity: Activity,
  nowKey = getJapanDateTimeKey()
): ActivityStatus {
  const normalizedNow = normalizeJapanDateTimeKey(nowKey)
  const endDateTime = getActivityEndDateTime(activity)
  if (endDateTime && normalizedNow > endDateTime) return "past"

  const startDateTime = getActivityStartDateTime(activity)
  if (startDateTime && normalizedNow >= startDateTime) return "ongoing"

  return "upcoming"
}

export function withActivityIndexes(activities: Activity[]): IndexedActivity[] {
  return activities.map((activity, originalIndex) => ({ ...activity, originalIndex }))
}

function activityOccursInMonth(activity: Activity, monthKey: string) {
  const performances = getValidActivityPerformances(activity.performances)
  if (performances.length) {
    return performances.some((performance) =>
      getPerformanceStartAt(performance).startsWith(`${monthKey}-`)
    )
  }
  if (activity.activeDates?.length) {
    return activity.activeDates.some((date) => date.startsWith(`${monthKey}-`))
  }

  const startDate = getActivityStartDate(activity)
  const endDate = getActivityEndDate(activity)
  if (!startDate || !endDate) return false

  const [year, month] = monthKey.split("-").map(Number)
  const lastDay = new Date(year, month, 0).getDate()
  const monthStart = `${monthKey}-01`
  const monthEnd = `${monthKey}-${String(lastDay).padStart(2, "0")}`

  return startDate <= monthEnd && endDate >= monthStart
}

export function getCalendarActivities(
  activities: Activity[],
  nowKey = getJapanDateTimeKey()
) {
  const currentMonthKey = normalizeJapanDateTimeKey(nowKey).substring(0, 7)

  return withActivityIndexes(activities).filter(
    (activity) =>
      getActivityStatus(activity, nowKey) !== "past" ||
      activityOccursInMonth(activity, currentMonthKey)
  )
}

export function getCurrentActivities(
  activities: Activity[],
  nowKey = getJapanDateTimeKey()
) {
  return withActivityIndexes(activities).filter(
    (activity) => getActivityStatus(activity, nowKey) !== "past"
  )
}

export function getPastActivities(
  activities: Activity[],
  nowKey = getJapanDateTimeKey()
) {
  return withActivityIndexes(activities)
    .filter((activity) => getActivityStatus(activity, nowKey) === "past")
    .sort((a, b) => (getActivityEndDate(b) ?? "").localeCompare(getActivityEndDate(a) ?? ""))
}
