export const JAPAN_TIME_ZONE = "Asia/Tokyo"

const japanDateTimeFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: JAPAN_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
})

function getPart(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes) {
  return parts.find((part) => part.type === type)?.value ?? ""
}

export function getJapanDateTimeKey(date = new Date()) {
  const parts = japanDateTimeFormatter.formatToParts(date)
  const year = getPart(parts, "year")
  const month = getPart(parts, "month")
  const day = getPart(parts, "day")
  const hour = getPart(parts, "hour")
  const minute = getPart(parts, "minute")
  return `${year}-${month}-${day}T${hour}:${minute}`
}

export function getJapanDateKey(date = new Date()) {
  return getJapanDateTimeKey(date).substring(0, 10)
}

export function normalizeJapanDateTimeKey(
  value: string,
  boundary: "start" | "end" = "start"
) {
  const normalized = value.trim().replace(" ", "T")
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return `${normalized}T${boundary === "start" ? "00:00" : "23:59"}`
  }
  return normalized.substring(0, 16)
}
