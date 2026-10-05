import type { Activity, ActivityMilestone, ActivityPerformance, LocalizedText, TicketEntry, WeeklyActivityRecurrenceOverride } from "../types"

export type EditorActivity = Activity & Record<string, unknown>
export type EditorPerformance = ActivityPerformance & Record<string, unknown>
export type EditorMilestone = ActivityMilestone & Record<string, unknown>
export type EditorTicketEntry = TicketEntry & Record<string, unknown>
export type EditorWeeklyOverride = WeeklyActivityRecurrenceOverride & Record<string, unknown>
export const EMPTY_LOCALIZED_TEXT: LocalizedText = { ja: "", en: "" }

export function setOptional<T extends Record<string, unknown>>(
  value: T,
  key: string,
  nextValue: unknown
) {
  const next: Record<string, unknown> = { ...value }
  if (nextValue === "" || nextValue === undefined || nextValue === false) {
    delete next[key]
  } else {
    next[key] = nextValue
  }
  return next as T
}

