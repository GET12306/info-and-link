import type { Activity } from "../types"
import { getActivityOccurrences } from "../utils/activitySchedule"
import type { ActivityReference } from "./resourceEditorSchema"

export function activityReference(activity: Activity): ActivityReference {
  const first = getActivityOccurrences(activity)[0]
  return {
    id: activity.id,
    title: activity.title,
    category: activity.category,
    scheduleLabel: activity.scheduleLabel,
    ...(first ? { startAt: first.startAt ?? first.date, startInstant: first.startInstant } : {}),
  }
}

/** Newest activity first; unknown dates last, with source order retained for ties. */
export function compareEditorActivities(a: ActivityReference, b: ActivityReference) {
  if (a.startInstant === undefined) return b.startInstant === undefined ? 0 : 1
  if (b.startInstant === undefined) return -1
  return b.startInstant - a.startInstant
}

export function activityDateLabel(activity?: ActivityReference) {
  return activity?.startAt?.replace("T", " ") || activity?.scheduleLabel || "日期未定"
}

export function activitySearchText(activity?: ActivityReference) {
  const title = activity?.title
  return [activity?.id, typeof title === "string" ? title : `${title?.ja ?? ""} ${title?.en ?? ""}`,
    activity?.category, activity?.scheduleLabel, activity?.startAt, activity?.startAt?.replace("T", " ")]
    .filter(Boolean).join(" ")
}

export function groupActivityResourceEntries<T extends { entry: Record<string, unknown>; index: number }>(
  entries: T[], references: ReadonlyMap<string, ActivityReference>
) {
  const groups = new Map<string, { activityId: string; activity?: ActivityReference; entries: T[] }>()
  for (const item of entries) {
    const activityId = String(item.entry.activityId ?? "")
    if (!groups.has(activityId)) groups.set(activityId, { activityId, activity: references.get(activityId), entries: [] })
    groups.get(activityId)!.entries.push(item)
  }
  return [...groups.values()].sort((a, b) => compareEditorActivities(a.activity ?? { id: a.activityId }, b.activity ?? { id: b.activityId }))
}
