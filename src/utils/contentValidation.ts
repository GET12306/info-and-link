/** Shared primitives for content validation; display normalization stays separate. */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}

export function isNonempty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0
}

export function isCalendarDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [year, month, day] = value.split("-").map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
}

export function isClockTime(value: unknown): value is string {
  return typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value)
}

export function isCalendarDateTime(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value) &&
    isCalendarDate(value.slice(0, 10)) && isClockTime(value.slice(11))
}

export function isHttpUrl(value: unknown): value is string {
  if (!isNonempty(value)) return false
  try {
    return ["https:", "http:"].includes(new URL(value).protocol)
  } catch { return false }
}
