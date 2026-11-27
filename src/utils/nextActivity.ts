import type { Activity } from "../types"
import { getActivityOccurrences, type ActivityOccurrence } from "./activitySchedule"

export function findNextActivity(activities: Activity[], now: number) {
  let next: { activity: Activity; occurrence: ActivityOccurrence } | undefined
  for (const activity of activities) {
    if (activity.recurrence && activity.recurrence.type !== "manual") continue
    const occurrence = getActivityOccurrences(activity).find((item) =>
      item.allDay ? item.endInstant >= now : item.startInstant >= now
    )
    if (occurrence && (!next || occurrence.startInstant < next.occurrence.startInstant)) {
      next = { activity, occurrence }
    }
  }
  return next
}
