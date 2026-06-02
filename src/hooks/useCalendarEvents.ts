import { parseISO, eachDayOfInterval, format, getDay } from "date-fns"

export interface CalendarEvent {
  date: string
  activityIndex: number
}

export interface CalendarDay {
  date: string | null
  dayNumber: number | null
  events: CalendarEvent[]
}

export interface CalendarMonthData {
  key: string
  label: string
  weeks: CalendarDay[][]
}

export function buildCalendarData(activities: any[]): CalendarMonthData[] {
  const events = collectEvents(activities)
  return buildMonths(events)
}

function collectEvents(activities: any[]): CalendarEvent[] {
  const result: CalendarEvent[] = []

  for (let i = 0; i < activities.length; i++) {
    const act = activities[i]
    if (!act.startDate) continue

    if (act.activeDates && Array.isArray(act.activeDates)) {
      for (const d of act.activeDates) {
        result.push({ date: d, activityIndex: i })
      }
    } else if (act.endDate) {
      const days = eachDayOfInterval({
        start: parseISO(act.startDate),
        end: parseISO(act.endDate),
      })
      for (const day of days) {
        result.push({ date: format(day, "yyyy-MM-dd"), activityIndex: i })
      }
    } else {
      result.push({ date: act.startDate, activityIndex: i })
    }
  }

  return result
}

function buildMonths(events: CalendarEvent[]): CalendarMonthData[] {
  const monthMap = new Map<string, CalendarEvent[]>()

  for (const ev of events) {
    const monthKey = ev.date.substring(0, 7)
    if (!monthMap.has(monthKey)) monthMap.set(monthKey, [])
    monthMap.get(monthKey)!.push(ev)
  }

  const sortedKeys = [...monthMap.keys()].sort()

  return sortedKeys.map((key) => {
    const [yearStr, monthStr] = key.split("-")
    const year = parseInt(yearStr)
    const monthIndex = parseInt(monthStr) - 1
    const lastDay = new Date(year, monthIndex + 1, 0).getDate()

    const monthEvents = monthMap.get(key)!

    const eventsByDay = new Map<string, CalendarEvent[]>()
    for (const ev of monthEvents) {
      if (!eventsByDay.has(ev.date)) eventsByDay.set(ev.date, [])
      eventsByDay.get(ev.date)!.push(ev)
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

    const label = `${year}年${monthIndex + 1}月`

    return { key, label, weeks }
  })
}
