import type { Activity, Language } from "../types"
import { getActivityOccurrences, getPerformanceOccurrences, type ActivityOccurrence } from "./activitySchedule"
import { isValidActivityMilestone } from "./activityMilestones"

// Export is stricter than the display calendar: never silently repair bad dates
// or export only the valid subset of an activity's schedule.
function validDate(value: string | undefined) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    getPerformanceOccurrences([{ occursOn: value }]).length === 1
}

function validDateTime(value: string) {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value) &&
    getPerformanceOccurrences([{ startAt: value }]).length === 1
}

export function getCalendarOccurrences(activity: Activity, now?: string): ActivityOccurrence[] {
  const mode = activity.calendarExport ?? "auto"
  if (!["auto", "enabled"].includes(mode)) return []
  if (!activity.title?.ja?.trim() || !activity.title?.en?.trim()) return []
  try {
    if (!/^https?:$/.test(new URL(activity.link).protocol)) return []
  } catch { return [] }

  if (activity.durationMinutes !== undefined &&
      (!Number.isInteger(activity.durationMinutes) || activity.durationMinutes <= 0)) return []

  if (activity.recurrence?.type === "weekly") {
    if (activity.performances?.length || activity.startDate || activity.endDate) return []
  } else if (activity.performances?.length) {
    if (activity.startDate || activity.endDate) return []
    for (const performance of activity.performances) {
      if (!performance) return []
      if (
        performance.milestones !== undefined &&
        (!Array.isArray(performance.milestones) ||
          !performance.milestones.every(isValidActivityMilestone))
      ) return []
      if ("occursOn" in performance) {
        if (!validDate(performance.occursOn) || performance.startAt || performance.endAt) return []
      } else {
        if (typeof performance.startAt !== "string" || !validDateTime(performance.startAt)) return []
        if (performance.endAt !== undefined &&
            (!validDateTime(performance.endAt) || performance.endAt <= performance.startAt)) return []
      }
    }
  } else {
    if (!validDate(activity.startDate)) return []
    if (activity.endDate !== undefined &&
        (!validDate(activity.endDate) || activity.endDate < activity.startDate!)) return []
  }

  const occurrences = getActivityOccurrences(activity)
  const keys = occurrences.map((occurrence) => occurrence.startAt ?? occurrence.date)
  if (new Set(keys).size !== keys.length) return []
  if (mode === "auto" && occurrences.some((occurrence) => occurrence.allDay)) return []
  return occurrences.filter((occurrence) => !now || occurrence.endAt >= now)
}

function escapeText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\r\n|\r|\n/g, "\\n")
    .replace(/;/g, "\\;").replace(/,/g, "\\,")
}

// RFC 5545 limits lines by UTF-8 octets, not JS string length.
function foldLine(value: string) {
  const encoder = new TextEncoder()
  let line = ""
  let size = 0
  const lines: string[] = []
  for (const character of value) {
    const bytes = encoder.encode(character).length
    if (size + bytes > 75) {
      lines.push(line)
      line = " "
      size = 1
    }
    line += character
    size += bytes
  }
  lines.push(line)
  return lines.join("\r\n")
}

function utcStamp(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z")
}

function getTimeZone(value?: string) {
  const candidate = value || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: candidate }).format()
    return candidate
  } catch {
    return "UTC"
  }
}

function getTimeZoneParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date)
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? ""
  return {
    year: get("year"), month: get("month"), day: get("day"),
    hour: get("hour"), minute: get("minute"), second: get("second"),
  }
}

function zonedStamp(date: Date, timeZone: string) {
  const part = getTimeZoneParts(date, timeZone)
  return `${part.year}${part.month}${part.day}T${part.hour}${part.minute}${part.second}`
}

function getOffsetMinutes(date: Date, timeZone: string) {
  const part = getTimeZoneParts(date, timeZone)
  return Math.round((Date.UTC(
    Number(part.year), Number(part.month) - 1, Number(part.day),
    Number(part.hour), Number(part.minute), Number(part.second)
  ) - date.getTime()) / 60_000)
}

function formatOffset(minutes: number) {
  const absolute = Math.abs(minutes)
  return `${minutes < 0 ? "-" : "+"}${String(Math.floor(absolute / 60)).padStart(2, "0")}${String(absolute % 60).padStart(2, "0")}`
}

function findTransition(left: Date, right: Date, offset: number, timeZone: string) {
  let low = Math.floor(left.getTime() / 60_000)
  let high = Math.floor(right.getTime() / 60_000)
  while (low + 1 < high) {
    const middle = Math.floor((low + high) / 2)
    if (getOffsetMinutes(new Date(middle * 60_000), timeZone) === offset) low = middle
    else high = middle
  }
  return new Date(high * 60_000)
}

function buildTimeZone(timeZone: string, dates: Date[]) {
  const years = dates.map((date) => Number(getTimeZoneParts(date, timeZone).year))
  const start = new Date(Date.UTC(Math.min(...years) - 1, 0, 1))
  const end = new Date(Date.UTC(Math.max(...years) + 2, 0, 1))
  const initialOffset = getOffsetMinutes(start, timeZone)
  const lines = [
    "BEGIN:VTIMEZONE", `TZID:${timeZone}`, "BEGIN:STANDARD",
    `DTSTART:${zonedStamp(start, timeZone)}`,
    `TZOFFSETFROM:${formatOffset(initialOffset)}`,
    `TZOFFSETTO:${formatOffset(initialOffset)}`,
    "END:STANDARD",
  ]
  let previousDate = start
  let previousOffset = initialOffset
  for (let time = start.getTime() + 6 * 60 * 60_000; time <= end.getTime(); time += 6 * 60 * 60_000) {
    const date = new Date(time)
    const offset = getOffsetMinutes(date, timeZone)
    if (offset !== previousOffset) {
      const transition = findTransition(previousDate, date, previousOffset, timeZone)
      const kind = offset > previousOffset ? "DAYLIGHT" : "STANDARD"
      const localTransition = utcStamp(
        new Date(transition.getTime() + previousOffset * 60_000)
      ).replace(/Z$/, "")
      lines.push(
        `BEGIN:${kind}`, `DTSTART:${localTransition}`,
        `TZOFFSETFROM:${formatOffset(previousOffset)}`,
        `TZOFFSETTO:${formatOffset(offset)}`, `END:${kind}`
      )
      previousOffset = offset
    }
    previousDate = date
  }
  lines.push("END:VTIMEZONE")
  return lines
}

export function getCalendarOccurrenceKey(occurrence: ActivityOccurrence) {
  return occurrence.startAt ?? occurrence.date
}

// An explicit selection keeps download controls independent of serialization.
// Add a separate milestone variant here when standalone milestone export ships;
// "all" deliberately means performances, not every supplementary time.
export type CalendarSelection =
  | { kind: "all" }
  | { kind: "performances"; keys: readonly string[] }

async function occurrenceUid(activity: Activity, occurrence: ActivityOccurrence) {
  // Independent of download time, display language, and YAML list order.
  // A UID does not make a downloaded file a live subscription.
  const identity = JSON.stringify([activity.id, occurrence.startAt ?? occurrence.date])
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(identity))
  return `${Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("")}@coco-info-hub`
}

export async function buildActivityCalendar(
  activity: Activity,
  lang: Language,
  options: { now?: string; selection?: CalendarSelection; occurrenceKey?: string; generatedAt?: Date; timeZone?: string } = {}
) {
  const selection = options.selection ?? (options.occurrenceKey
    ? { kind: "performances" as const, keys: [options.occurrenceKey] }
    : { kind: "all" as const })
  const occurrences = getCalendarOccurrences(activity, options.now).filter((occurrence) =>
    selection.kind === "all" || selection.keys.includes(getCalendarOccurrenceKey(occurrence)))
  if (!occurrences.length) return null
  const stamp = utcStamp(options.generatedAt ?? new Date())
  const timeZone = getTimeZone(options.timeZone)
  const timedDates = occurrences.flatMap((occurrence) => occurrence.startAt
    ? [new Date(`${occurrence.startAt}:00+09:00`), new Date(`${occurrence.endAt}:00+09:00`)]
    : [])
  const lines = [
    "BEGIN:VCALENDAR", "VERSION:2.0",
    "PRODID:-//Coco Unofficial Info Hub//Activities//EN",
    "CALSCALE:GREGORIAN", `X-WR-TIMEZONE:${timeZone}`,
    ...(timedDates.length ? buildTimeZone(timeZone, timedDates) : []),
  ]
  for (const occurrence of occurrences) {
    const title = [activity.title[lang], occurrence.label?.[lang]].filter(Boolean).join(" — ")
    lines.push("BEGIN:VEVENT", `UID:${await occurrenceUid(activity, occurrence)}`, `DTSTAMP:${stamp}`,
      `SUMMARY:${escapeText(title)}`,
      `URL:${new URL(activity.link).href}`)
    if (activity.venue?.[lang]) lines.push(`LOCATION:${escapeText(activity.venue[lang])}`)
    if (occurrence.allDay) {
      const nextDay = new Date(`${occurrence.date}T00:00:00Z`)
      nextDay.setUTCDate(nextDay.getUTCDate() + 1)
      lines.push(`DTSTART;VALUE=DATE:${occurrence.date.replace(/-/g, "")}`,
        `DTEND;VALUE=DATE:${nextDay.toISOString().substring(0, 10).replace(/-/g, "")}`)
    } else {
      lines.push(
        `DTSTART;TZID=${timeZone}:${zonedStamp(new Date(`${occurrence.startAt}:00+09:00`), timeZone)}`,
        `DTEND;TZID=${timeZone}:${zonedStamp(new Date(`${occurrence.endAt}:00+09:00`), timeZone)}`
      )
    }
    lines.push("END:VEVENT")
  }
  lines.push("END:VCALENDAR")
  return `${lines.map(foldLine).join("\r\n")}\r\n`
}
