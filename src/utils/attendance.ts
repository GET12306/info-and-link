import type { Activity } from "../types"
import type { ActivityOccurrence } from "./activitySchedule"

export function getAttendanceKey(activity: Activity, occurrence: ActivityOccurrence): string | undefined {
  if (activity.recurrence) return undefined
  const slot = occurrence.id ? `id:${occurrence.id}` : `date:${occurrence.startAt ?? occurrence.date}`
  return `${activity.id}/${slot}`
}
