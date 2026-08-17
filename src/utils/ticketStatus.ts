import type { Activity, TicketEntry } from "../types"
import { getCurrentActivities, withActivityIndexes, type IndexedActivity } from "./activityStatus"
import { getJapanDateTimeKey, normalizeJapanDateTimeKey } from "./japanTime"

export type TicketStatus = "upcoming" | "open" | "past" | "tba"

export interface IndexedTicketEntry {
  activity: IndexedActivity
  entry: TicketEntry
  entryIndex: number
  status: TicketStatus
}

export interface TicketActivityGroup {
  activity: IndexedActivity
  entries: IndexedTicketEntry[]
}

export function getTicketEntryLink(activity: Activity, entry: TicketEntry) {
  return entry.link ?? activity.ticketInfo?.link ?? activity.link
}

export function getTicketEntryPrice(activity: Activity, entry: TicketEntry) {
  return entry.price ?? activity.ticketInfo?.price
}

export function getTicketStatus(
  entry: TicketEntry,
  nowKey = getJapanDateTimeKey()
): TicketStatus {
  const normalizedNow = normalizeJapanDateTimeKey(nowKey)
  const endKey = entry.endAt
    ? normalizeJapanDateTimeKey(entry.endAt, "end")
    : entry.endDate
      ? normalizeJapanDateTimeKey(entry.endDate, "end")
      : null
  const startKey = entry.startAt
    ? normalizeJapanDateTimeKey(entry.startAt)
    : entry.startDate
      ? normalizeJapanDateTimeKey(entry.startDate)
      : null

  if (endKey && normalizedNow > endKey) return "past"
  if (startKey && normalizedNow < startKey) return "upcoming"
  if (startKey || endKey) return "open"
  return "tba"
}

function getTicketEntries(
  activities: IndexedActivity[],
  nowKey = getJapanDateTimeKey()
): IndexedTicketEntry[] {
  return activities.flatMap((activity) =>
    (activity.ticketInfo?.entries ?? []).map((entry, entryIndex) => ({
      activity,
      entry,
      entryIndex,
      status: getTicketStatus(entry, nowKey),
    }))
  )
}

function groupTicketEntries(entries: IndexedTicketEntry[]): TicketActivityGroup[] {
  const map = new Map<number, TicketActivityGroup>()

  for (const ticketEntry of entries) {
    const key = ticketEntry.activity.originalIndex
    const group = map.get(key)
    if (group) {
      group.entries.push(ticketEntry)
    } else {
      map.set(key, { activity: ticketEntry.activity, entries: [ticketEntry] })
    }
  }

  return [...map.values()]
}

export function getCurrentTicketGroups(
  activities: Activity[],
  nowKey = getJapanDateTimeKey()
) {
  const currentActivities = getCurrentActivities(activities, nowKey)
  const entries = getTicketEntries(currentActivities, nowKey).filter(
    (entry) => entry.status !== "past"
  )
  return groupTicketEntries(entries)
}

export function getPastTicketGroups(
  activities: Activity[],
  nowKey = getJapanDateTimeKey()
) {
  const entries = getTicketEntries(withActivityIndexes(activities), nowKey)
    .filter((entry) => entry.status === "past")
    .sort((a, b) =>
      (b.entry.endAt ?? b.entry.endDate ?? "").localeCompare(
        a.entry.endAt ?? a.entry.endDate ?? ""
      )
    )

  return groupTicketEntries(entries)
}

export function hasCurrentTicketInfo(
  activity: Activity,
  nowKey = getJapanDateTimeKey()
) {
  return (activity.ticketInfo?.entries ?? []).some(
    (entry) => getTicketStatus(entry, nowKey) !== "past"
  )
}
