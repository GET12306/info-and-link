import type { Activity } from "../types"

export type ActivityStatus = "upcoming" | "ongoing" | "past"
export type IndexedActivity = Activity & { originalIndex: number }

export function getTodayKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

export function getActivityEndDate(activity: Activity): string | null {
  if (activity.activeDates?.length) {
    return [...activity.activeDates].sort().at(-1) ?? null
  }
  return activity.endDate ?? activity.startDate ?? null
}

export function getActivityStartDate(activity: Activity): string | null {
  if (activity.activeDates?.length) {
    return [...activity.activeDates].sort()[0] ?? null
  }
  return activity.startDate ?? null
}

export function getActivityStatus(activity: Activity, todayKey = getTodayKey()): ActivityStatus {
  const endDate = getActivityEndDate(activity)
  if (endDate && todayKey > endDate) return "past"

  const startDate = getActivityStartDate(activity)
  if (startDate && todayKey >= startDate) return "ongoing"

  return "upcoming"
}

export function withActivityIndexes(activities: Activity[]): IndexedActivity[] {
  return activities.map((activity, originalIndex) => ({ ...activity, originalIndex }))
}

export function getCurrentActivities(activities: Activity[], todayKey = getTodayKey()) {
  return withActivityIndexes(activities).filter((activity) => getActivityStatus(activity, todayKey) !== "past")
}

export function getPastActivities(activities: Activity[], todayKey = getTodayKey()) {
  return withActivityIndexes(activities)
    .filter((activity) => getActivityStatus(activity, todayKey) === "past")
    .sort((a, b) => (getActivityEndDate(b) ?? "").localeCompare(getActivityEndDate(a) ?? ""))
}
