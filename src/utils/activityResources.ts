import type { ActivityResource } from "../types"

export function filterActivityResources(resources: ActivityResource[], activityId = "", kind = "") {
  return resources.filter(resource =>
    (!activityId || resource.activityId === activityId) && (!kind || resource.kind === kind)
  ).sort((a, b) => b.date.localeCompare(a.date))
}
