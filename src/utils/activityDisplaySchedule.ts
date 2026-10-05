import type { Activity } from "../types"
import { getActivityOccurrences } from "./activitySchedule"
import { dateTimeForViewer, viewerTimeZone } from "./timeZone"

/** A concise date-only summary in the viewer's calendar dates. */
export function getActivityDisplaySchedule(activity: Activity, timeZone = viewerTimeZone()) {
  if (activity.recurrence) return null
  const occurrences = getActivityOccurrences(activity)
  const dates = [...new Set(occurrences.map((item) => item.allDay
    ? item.date
    : dateTimeForViewer(item.startInstant, timeZone).substring(0, 10)))]
  if (!dates.length) return null
  return dates.length === 1 ? dates[0] : `${dates[0]} – ${dates.at(-1)}`
}
