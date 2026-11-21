import { isCalendarDate, isCalendarDateTime, isRecord } from "./contentValidation"

/** Display punctuation only; machine-readable YAML dates keep their ISO format. */
export function formatScheduleDateTime(value: string) {
  return value.replace(/-/g, ".").replace("T", " ")
}

export function hasTicketScheduleDates(entry: { startAt?: unknown; endAt?: unknown }) {
  return [entry.startAt, entry.endAt].some(value => isCalendarDate(value) || isCalendarDateTime(value))
}

export function hasActivityScheduleDates(activity: {
  startDate?: unknown; endDate?: unknown; performances?: unknown; recurrence?: unknown
}) {
  return isCalendarDate(activity.startDate) || isCalendarDate(activity.endDate) ||
    (Array.isArray(activity.performances) && activity.performances.some(item => isRecord(item) &&
      (isCalendarDate(item.occursOn) || isCalendarDateTime(item.startAt)))) ||
    (isRecord(activity.recurrence) && ["weekly", "monthly"].includes(String(activity.recurrence.type)) && isCalendarDate(activity.recurrence.startOn))
}
