import type { Activity, ActivityPerformance } from "../types"
import { isRecord } from "./contentValidation"

export const ACTIVITY_SCHEDULE_FILE_PATTERN = /^activity-schedules\/[a-z0-9]+(?:-[a-z0-9]+)*\.yaml$/

export function scheduleFileReferences(activities: Activity[]) {
  const files = new Set<string>()
  for (const activity of activities) {
    const file = activity.performancesFile
    if (file === undefined) continue
    if (!ACTIVITY_SCHEDULE_FILE_PATTERN.test(file)) throw new Error(`Invalid performancesFile: ${file}`)
    if (files.has(file)) throw new Error(`performancesFile is shared by multiple activities: ${file}`)
    files.add(file)
  }
  return [...files].sort()
}

/** Resolve files once; every page and the editor consume ordinary Activity.performances. */
export function attachActivitySchedules(activities: Activity[], files: Record<string, unknown>): Activity[] {
  scheduleFileReferences(activities)
  return activities.map(activity => {
    if (!activity.performancesFile) return activity
    if (activity.performances !== undefined) throw new Error(`${activity.id}: use performances or performancesFile, not both`)
    const child = files[activity.performancesFile]
    if (!isRecord(child) || !Array.isArray(child.performances)) {
      throw new Error(`${activity.performancesFile}: expected an object containing performances`)
    }
    return { ...activity, performances: child.performances as ActivityPerformance[] }
  })
}
