import { getDay } from "date-fns"
import type { Activity } from "../types"
import { getActivityOccurrences } from "../utils/activitySchedule"
import { getJapanTimeLabel } from "../utils/japanTime"

export interface CalendarEvent {
  date: string
  activityIndex: number
  performanceIndex?: number
  startAt?: string
  endAt: string
  startTime?: string
}

export interface CalendarDay {
  date: string | null
  dayNumber: number | null
  events: CalendarEvent[]
}

export interface CalendarMonthData {
  key: string
  weeks: CalendarDay[][]
}

export function buildCalendarData(activities: Activity[], includeDate?: string): CalendarMonthData[] {
  const events = collectEvents(activities)
  return buildMonths(events, includeDate?.substring(0, 7))
}

function collectEvents(activities: Activity[]): CalendarEvent[] {
  const result: CalendarEvent[] = []

  for (let i = 0; i < activities.length; i++) {
    const act = activities[i]
    getActivityOccurrences(act).forEach((occurrence) => {
      result.push({
        date: occurrence.date,
        activityIndex: i,
        performanceIndex: occurrence.performanceIndex,
        startAt: occurrence.startAt,
        endAt: occurrence.endAt,
        startTime: occurrence.startAt
          ? getJapanTimeLabel(occurrence.startAt)
          : undefined,
      })
    })
  }

  return result
}

function buildMonths(events: CalendarEvent[], includeMonthKey?: string): CalendarMonthData[] {
  const monthMap = new Map<string, CalendarEvent[]>()

  for (const ev of events) {
    const monthKey = ev.date.substring(0, 7)
    if (!monthMap.has(monthKey)) monthMap.set(monthKey, [])
    monthMap.get(monthKey)!.push(ev)
  }

  const eventMonthKeys = [...monthMap.keys()].sort()
  const sortedKeys = includeMonthKey
    ? buildMonthRange(
        includeMonthKey,
        eventMonthKeys.filter((key) => key >= includeMonthKey).at(-1) ??
          includeMonthKey
      )
    : eventMonthKeys

  return sortedKeys.map((key) => {
    const [yearStr, monthStr] = key.split("-")
    const year = parseInt(yearStr)
    const monthIndex = parseInt(monthStr) - 1
    const lastDay = new Date(year, monthIndex + 1, 0).getDate()

    const monthEvents = monthMap.get(key) ?? []

    const eventsByDay = new Map<string, CalendarEvent[]>()
    for (const ev of monthEvents) {
      if (!eventsByDay.has(ev.date)) eventsByDay.set(ev.date, [])
      eventsByDay.get(ev.date)!.push(ev)
    }
    for (const dayEvents of eventsByDay.values()) {
      dayEvents.sort((a, b) =>
        (a.startTime ?? "").localeCompare(b.startTime ?? "")
      )
    }

    const weeks: CalendarDay[][] = []
    let currentRow: CalendarDay[] = []

    const firstDow = getDay(new Date(year, monthIndex, 1))
    const offset = firstDow

    for (let i = 0; i < offset; i++) {
      currentRow.push({ date: null, dayNumber: null, events: [] })
    }

    for (let day = 1; day <= lastDay; day++) {
      const dateStr = `${key}-${String(day).padStart(2, "0")}`
      const dayEvents = eventsByDay.get(dateStr) || []
      currentRow.push({ date: dateStr, dayNumber: day, events: dayEvents })

      if (currentRow.length === 7) {
        weeks.push(currentRow)
        currentRow = []
      }
    }

    if (currentRow.length > 0) {
      while (currentRow.length < 7) {
        currentRow.push({ date: null, dayNumber: null, events: [] })
      }
      weeks.push(currentRow)
    }

    while (weeks.length < 6) {
      weeks.push(Array.from({ length: 7 }, () => ({ date: null, dayNumber: null, events: [] })))
    }

    return { key, weeks }
  })
}

function buildMonthRange(startKey: string, endKey: string) {
  const [startYear, startMonth] = startKey.split("-").map(Number)
  const [endYear, endMonth] = endKey.split("-").map(Number)
  const startIndex = startYear * 12 + startMonth - 1
  const endIndex = endYear * 12 + endMonth - 1

  return Array.from(
    { length: Math.max(endIndex - startIndex + 1, 1) },
    (_, offset) => {
      const monthIndex = startIndex + offset
      const year = Math.floor(monthIndex / 12)
      const month = (monthIndex % 12) + 1
      return `${year}-${String(month).padStart(2, "0")}`
    }
  )
}
