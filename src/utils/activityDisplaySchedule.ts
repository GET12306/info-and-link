import type { Activity } from "../types"
import { getActivityOccurrences } from "./activitySchedule"
import { dateTimeForViewer, viewerTimeZone } from "./timeZone"
import { formatScheduleDateTime } from "./scheduleDisplay"

/** A concise date-only summary in the viewer's calendar dates. */
export function getActivityDisplaySchedule(activity: Activity, timeZone = viewerTimeZone()) {
  const occurrences = getActivityOccurrences(activity)
  const dates = [...new Set(occurrences.map((item) => item.allDay
    ? item.date
    : dateTimeForViewer(item.startInstant, timeZone).substring(0, 10)))].sort()
  if (!dates.length) {
    for (const date of [activity.startDate, activity.endDate]) if (date) dates.push(date)
  }
  if (!dates.length) return null
  return dates.length === 1 ? formatScheduleDateTime(dates[0]) : `${formatScheduleDateTime(dates[0])} – ${formatScheduleDateTime(dates.at(-1)!)}`
}
