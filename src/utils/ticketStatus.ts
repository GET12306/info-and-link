import type { Activity, TicketEntry } from "../types"
import { getCurrentActivities, getTodayKey, withActivityIndexes, type IndexedActivity } from "./activityStatus"

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

export function getTicketStatus(entry: TicketEntry, todayKey = getTodayKey()): TicketStatus {
  if (entry.endDate && todayKey > entry.endDate) return "past"
  if (entry.startDate && todayKey < entry.startDate) return "upcoming"
  if (entry.startDate || entry.endDate) return "open"
  return "tba"
}

function getTicketEntries(activities: IndexedActivity[], todayKey = getTodayKey()): IndexedTicketEntry[] {
  return activities.flatMap((activity) =>
    (activity.ticketInfo?.entries ?? []).map((entry, entryIndex) => ({
      activity,
      entry,
      entryIndex,
      status: getTicketStatus(entry, todayKey),
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

export function getCurrentTicketGroups(activities: Activity[], todayKey = getTodayKey()) {
  const currentActivities = getCurrentActivities(activities, todayKey)
  const entries = getTicketEntries(currentActivities, todayKey).filter((entry) => entry.status !== "past")
  return groupTicketEntries(entries)
}

export function getPastTicketGroups(activities: Activity[], todayKey = getTodayKey()) {
  const entries = getTicketEntries(withActivityIndexes(activities), todayKey)
    .filter((entry) => entry.status === "past")
    .sort((a, b) => (b.entry.endDate ?? "").localeCompare(a.entry.endDate ?? ""))

  return groupTicketEntries(entries)
}

export function hasCurrentTicketInfo(activity: Activity, todayKey = getTodayKey()) {
  return (activity.ticketInfo?.entries ?? []).some((entry) => getTicketStatus(entry, todayKey) !== "past")
}
