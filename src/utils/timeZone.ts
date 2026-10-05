import { isCalendarDateTime } from "./contentValidation"
import { normalizeJapanDateTimeKey } from "./japanTime"

/** Existing unqualified YAML times are authored in Japan time. */
export const DEFAULT_SOURCE_TIME_ZONE = "Asia/Tokyo"

const formatters = new Map<string, Intl.DateTimeFormat>()

export function isValidTimeZone(value: unknown): value is string {
  if (typeof value !== "string" || !value.trim()) return false
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value }).format()
    return true
  } catch {
    return false
  }
}

export function sourceTimeZone(value?: string) {
  return isValidTimeZone(value) ? value : DEFAULT_SOURCE_TIME_ZONE
}

export function viewerTimeZone() {
  const value = Intl.DateTimeFormat().resolvedOptions().timeZone
  return isValidTimeZone(value) ? value : "UTC"
}

export function dateTimeInZone(date: Date | number, timeZone: string) {
  let formatter = formatters.get(timeZone)
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone, year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hourCycle: "h23",
    })
    if (formatters.size > 32) formatters.clear()
    formatters.set(timeZone, formatter)
  }
  const parts = formatter.formatToParts(date)
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? ""
  return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}`
}

/** Resolve a wall clock value to an instant. Reject nonexistent DST times; choose the first repeated time. */
export function instantFromZonedDateTime(value: string, timeZone: string): number | null {
  if (!isCalendarDateTime(value) || !isValidTimeZone(timeZone)) return null
  const [year, month, day, hour, minute] = value.match(/\d+/g)!.map(Number)
  const wall = Date.UTC(year, month - 1, day, hour, minute)
  const offsets = new Set<number>()
  for (const sample of [wall - 86_400_000, wall, wall + 86_400_000]) {
    const local = dateTimeInZone(sample, timeZone)
    const [y, m, d, h, min] = local.match(/\d+/g)!.map(Number)
    offsets.add(Date.UTC(y, m - 1, d, h, min) - sample)
  }
  const matches = [...offsets].map((offset) => wall - offset)
    .filter((instant) => dateTimeInZone(instant, timeZone) === value)
  return matches.length ? Math.min(...matches) : null
}

export function instantFromSourceKey(
  value: string, timeZone: string,
  boundary: "start" | "end" = "start"
) {
  return instantFromZonedDateTime(normalizeJapanDateTimeKey(value, boundary), timeZone)
}

export function dateTimeForViewer(instant: number, timeZone = viewerTimeZone()) {
  return dateTimeInZone(instant, timeZone)
}
