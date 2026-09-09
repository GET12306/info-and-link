import type { Activity } from "../types"
import {
  getJapanDateKey,
  getJapanDateTimeKey,
  normalizeJapanDateTimeKey,
} from "./japanTime"
import {
  getActivityOccurrences,
  type ActivityOccurrence,
} from "./activitySchedule"

export type ActivityStatus = "upcoming" | "ongoing" | "past"

export function getTodayKey(date = new Date()) {
  return getJapanDateKey(date)
}

function getOccurrenceBounds(occurrences: ActivityOccurrence[]) {
  let startAt: string | null = null
  let endAt: string | null = null

  for (const occurrence of occurrences) {
    const occurrenceStartAt = occurrence.startAt ?? `${occurrence.date}T00:00`
    if (!startAt || occurrenceStartAt < startAt) startAt = occurrenceStartAt
    if (!endAt || occurrence.endAt > endAt) endAt = occurrence.endAt
  }

  return { startAt, endAt }
}

function getActivityStatusFromOccurrences(
  activity: Activity,
  occurrences: ActivityOccurrence[],
  nowKey: string
): ActivityStatus {
  if (activity.recurrence) return "ongoing"

  const { startAt, endAt } = getOccurrenceBounds(occurrences)
  if (endAt && nowKey > endAt) return "past"
  if (startAt && nowKey >= startAt) return "ongoing"
  return "upcoming"
}

export function getActivityEndDate(activity: Activity): string | null {
  return (
    getOccurrenceBounds(getActivityOccurrences(activity)).endAt?.substring(
      0,
      10
    ) ?? null
  )
}

function getActivityStartAt(activity: Activity) {
  return getOccurrenceBounds(getActivityOccurrences(activity)).startAt
}

export function getActivityStartDate(activity: Activity): string | null {
  return getActivityStartAt(activity)?.substring(0, 10) ?? null
}

export function compareActivitiesByStart(a: Activity, b: Activity) {
  const aStart = a.recurrence ? null : getActivityStartAt(a)
  const bStart = b.recurrence ? null : getActivityStartAt(b)
  const aGroup = a.recurrence ? 1 : aStart ? 0 : 2
  const bGroup = b.recurrence ? 1 : bStart ? 0 : 2
  if (aGroup !== bGroup) return aGroup - bGroup
  if (aGroup !== 0) return 0
  if (aStart === bStart) return 0
  return aStart.localeCompare(bStart)
}

export function getActivityStatus(
  activity: Activity,
  nowKey = getJapanDateTimeKey()
): ActivityStatus {
  const normalizedNow = normalizeJapanDateTimeKey(nowKey)
  return getActivityStatusFromOccurrences(
    activity,
    getActivityOccurrences(activity),
    normalizedNow
  )
}

function activityOccursInMonth(
  occurrences: ActivityOccurrence[],
  monthKey: string
) {
  return occurrences.some((occurrence) =>
    occurrence.date.startsWith(`${monthKey}-`)
  )
}

export function getCalendarActivities(
  activities: Activity[],
  nowKey = getJapanDateTimeKey()
) {
  const normalizedNow = normalizeJapanDateTimeKey(nowKey)
  const currentMonthKey = normalizedNow.substring(0, 7)

  return activities.filter((activity) => {
    const occurrences = getActivityOccurrences(activity)
    if (occurrences.length === 0) return false
    return (
      getActivityStatusFromOccurrences(activity, occurrences, normalizedNow) !==
        "past" || activityOccursInMonth(occurrences, currentMonthKey)
    )
  })
}

export function getCurrentActivities(
  activities: Activity[],
  nowKey = getJapanDateTimeKey()
) {
  return activities.filter(
    (activity) => getActivityStatus(activity, nowKey) !== "past"
  )
}

export function getPastActivities(
  activities: Activity[],
  nowKey = getJapanDateTimeKey()
) {
  return activities
    .filter((activity) => getActivityStatus(activity, nowKey) === "past")
    .sort((a, b) => (getActivityEndDate(b) ?? "").localeCompare(getActivityEndDate(a) ?? ""))
}
