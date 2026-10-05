import type { Activity, TicketEntry } from "../types"
import { getCurrentActivities } from "./activityStatus"
import { getJapanDateTimeKey, normalizeJapanDateTimeKey } from "./japanTime"
import { dateTimeForViewer, instantFromSourceKey, sourceTimeZone, viewerTimeZone } from "./timeZone"

export type TicketStatus = "upcoming" | "open" | "past" | "tba"

export interface IndexedTicketEntry {
  activity: Activity
  entry: TicketEntry
  entryIndex: number
  status: TicketStatus
}

export interface TicketActivityGroup {
  activity: Activity
  entries: IndexedTicketEntry[]
}

export function getTicketEntryLink(activity: Activity, entry: TicketEntry) {
  return entry.link ?? activity.ticketInfo?.link ?? activity.link
}

export function getTicketEntryPrice(activity: Activity, entry: TicketEntry) {
  return entry.price ?? activity.ticketInfo?.price
}

export function getTicketDisplaySchedule(entry: TicketEntry, activityTimeZone?: string) {
  const timeZone = sourceTimeZone(entry.timeZone ?? activityTimeZone)
  const format = (value: string, boundary: "start" | "end") => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
    const instant = instantFromSourceKey(value, timeZone, boundary)
    return instant === null ? value : dateTimeForViewer(instant, viewerTimeZone()).replace("T", " ")
  }
  const start = entry.startAt ? format(entry.startAt, "start") : null
  const end = entry.endAt ? format(entry.endAt, "end") : null
  return start && end ? `${start} – ${end}` : start ?? end
}

export function getTicketStatus(
  entry: TicketEntry,
  nowKey = getJapanDateTimeKey(),
  activityTimeZone?: string
): TicketStatus {
  const normalizedNow = normalizeJapanDateTimeKey(nowKey)
  const now = instantFromSourceKey(normalizedNow, sourceTimeZone()) ?? Date.now()
  const timeZone = sourceTimeZone(entry.timeZone ?? activityTimeZone)
  const endKey = entry.endAt
    ? instantFromSourceKey(entry.endAt, timeZone, "end")
    : null
  const startKey = entry.startAt
    ? instantFromSourceKey(entry.startAt, timeZone)
    : null

  if (endKey !== null && now > endKey) return "past"
  if (startKey !== null && now < startKey) return "upcoming"
  if (startKey !== null || endKey !== null) return "open"
  return "tba"
}

function getTicketEntries(
  activities: Activity[],
  nowKey = getJapanDateTimeKey()
): IndexedTicketEntry[] {
  return activities.flatMap((activity) =>
    (activity.ticketInfo?.entries ?? []).map((entry, entryIndex) => ({
      activity,
      entry,
      entryIndex,
      status: getTicketStatus(entry, nowKey, activity.timeZone),
    }))
  )
}

function groupTicketEntries(entries: IndexedTicketEntry[]): TicketActivityGroup[] {
  const map = new Map<string, TicketActivityGroup>()

  for (const ticketEntry of entries) {
    const key = ticketEntry.activity.id
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

export function hasCurrentTicketInfo(
  activity: Activity,
  nowKey = getJapanDateTimeKey()
) {
  return (activity.ticketInfo?.entries ?? []).some(
    (entry) => getTicketStatus(entry, nowKey, activity.timeZone) !== "past"
  )
}
