import type { Activity, ActivityResource } from "../types"
import { getActivityOccurrences } from "./activitySchedule"
import { latestRelatedResourceDate } from "./relatedResources"

export function filterActivityResources(resources: ActivityResource[], activityId = "", kind = "") {
  return resources.filter(resource =>
    (!activityId || resource.activityId === activityId) && (!kind || resource.kind === kind)
  ).sort((a, b) => latestRelatedResourceDate(b).localeCompare(latestRelatedResourceDate(a)))
}

/** Episode identity is its schedule key, never inferred from the post's date. */
export function groupEpisodeResources(resources: ActivityResource[], activity?: Activity) {
  const occurrences = activity ? getActivityOccurrences(activity) : []
  const groups = new Map<string, { key: string; performance?: typeof occurrences[number]; resources: ActivityResource[] }>()
  for (const resource of resources) {
    const key = resource.performance ?? ""
    if (!groups.has(key)) groups.set(key, { key, performance: occurrences.find(item => (item.startAt ?? item.date) === key), resources: [] })
    groups.get(key)!.resources.push(resource)
  }
  return [...groups.values()].sort((a, b) => b.key.localeCompare(a.key))
}
