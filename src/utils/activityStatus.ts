import type { Activity } from "../types"
import {
  getJapanDateTimeKey,
  normalizeJapanDateTimeKey,
} from "./japanTime"
import {
  getActivityOccurrences,
  type ActivityOccurrence,
} from "./activitySchedule"
import { dateTimeInZone, instantFromSourceKey, sourceTimeZone, viewerTimeZone } from "./timeZone"

export type ActivityStatus = "upcoming" | "ongoing" | "past"

function getOccurrenceBounds(occurrences: ActivityOccurrence[]) {
  let start: ActivityOccurrence | null = null
  let end: ActivityOccurrence | null = null

  for (const occurrence of occurrences) {
    if (!start || occurrence.startInstant < start.startInstant) start = occurrence
    if (!end || occurrence.endInstant > end.endInstant) end = occurrence
  }

  return { start, end }
}

function getActivityStatusFromOccurrences(
  activity: Activity,
  occurrences: ActivityOccurrence[],
  nowKey: string
): ActivityStatus {
  if (activity.recurrence) return "ongoing"

  const { start, end } = getOccurrenceBounds(occurrences)
  const now = instantFromSourceKey(nowKey, sourceTimeZone()) ?? Date.now()
  if (end && now > end.endInstant) return "past"
  if (start && now >= start.startInstant) return "ongoing"
  return "upcoming"
}

export function getActivityEndDate(activity: Activity): string | null {
  const end = getOccurrenceBounds(getActivityOccurrences(activity)).end
  return end ? end.allDay ? end.date : dateTimeInZone(end.endInstant, viewerTimeZone()).substring(0, 10) : null
}

function getActivityStartAt(activity: Activity) {
  return getOccurrenceBounds(getActivityOccurrences(activity)).start
}

export function getActivityStartDate(activity: Activity): string | null {
  const start = getActivityStartAt(activity)
  return start ? start.allDay ? start.date : dateTimeInZone(start.startInstant, viewerTimeZone()).substring(0, 10) : null
}

export function compareActivitiesByStart(a: Activity, b: Activity) {
  const aStart = a.recurrence ? null : getActivityStartAt(a)
  const bStart = b.recurrence ? null : getActivityStartAt(b)
  const aGroup = a.recurrence ? 1 : aStart ? 0 : 2
  const bGroup = b.recurrence ? 1 : bStart ? 0 : 2
  if (aGroup !== bGroup) return aGroup - bGroup
  if (aGroup !== 0) return 0
  return (aStart?.startInstant ?? 0) - (bStart?.startInstant ?? 0)
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

export function getCalendarActivities(
  activities: Activity[],
  nowKey = getJapanDateTimeKey()
) {
  const normalizedNow = normalizeJapanDateTimeKey(nowKey)
  const nowInstant = instantFromSourceKey(normalizedNow, sourceTimeZone()) ?? Date.now()
  const currentMonthKey = dateTimeInZone(nowInstant, viewerTimeZone()).substring(0, 7)

  return activities.filter((activity) => {
    const occurrences = getActivityOccurrences(activity)
    if (occurrences.length === 0) return false
    return getActivityStatusFromOccurrences(activity, occurrences, normalizedNow) !== "past" ||
      occurrences.some((occurrence) => (occurrence.allDay ? occurrence.date :
        dateTimeInZone(occurrence.startInstant, viewerTimeZone()).substring(0, 10)).startsWith(`${currentMonthKey}-`))
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
  const normalizedNow = normalizeJapanDateTimeKey(nowKey)
  return activities
    .map(activity => {
      const occurrences = getActivityOccurrences(activity)
      return {
        activity,
        status: getActivityStatusFromOccurrences(activity, occurrences, normalizedNow),
        endDate: getOccurrenceBounds(occurrences).end?.endInstant ?? 0,
      }
    })
    .filter(item => item.status === "past")
    .sort((a, b) => b.endDate - a.endDate)
    .map(item => item.activity)
}
