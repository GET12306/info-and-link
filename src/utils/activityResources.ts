import type { ActivityResource } from "../types"
import { latestRelatedResourceDate } from "./relatedResources"

export function filterActivityResources(resources: ActivityResource[], activityId = "", kind = "") {
  return resources.filter(resource =>
    (!activityId || resource.activityId === activityId) && (!kind || resource.kind === kind)
  ).sort((a, b) => latestRelatedResourceDate(b).localeCompare(latestRelatedResourceDate(a)))
}
