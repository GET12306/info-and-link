import type { ActivityResource } from "../types"
import { relatedResourceLinkCount } from "./relatedResources"

export interface ActivityResourceGroup {
  activityId: string
  resources: ActivityResource[]
}

export function filterActivityResources(resources: ActivityResource[], activityId = "", kind = "") {
  return resources.filter(resource =>
    (!activityId || resource.activityId === activityId) && (!kind || resource.kind === kind)
  ).sort((a, b) => b.date.localeCompare(a.date))
}

export function countActivityResources(resources: ActivityResource[]) {
  const counts = new Map<string, number>()
  for (const resource of resources) {
    counts.set(resource.activityId, (counts.get(resource.activityId) ?? 0) + relatedResourceLinkCount(resource))
  }
  return counts
}

export function groupActivityResources(resources: ActivityResource[]): ActivityResourceGroup[] {
  const groups = new Map<string, ActivityResource[]>()
  const sorted = [...resources].sort((a, b) => b.date.localeCompare(a.date))

  for (const resource of sorted) {
    const group = groups.get(resource.activityId)
    if (group) group.push(resource)
    else groups.set(resource.activityId, [resource])
  }

  return [...groups].map(([activityId, groupedResources]) => ({
    activityId,
    resources: groupedResources,
  }))
}
