import { Bookmark, CalendarPlus, Check, SlidersHorizontal } from "lucide-react"
import { useId, useState } from "react"
import { TRANSLATIONS } from "../i18n"
import type { Activity, Language } from "../types"
import {
  getAvailableCalendarEventKinds,
  getCalendarOccurrences,
  getCalendarOccurrenceKey,
  occurrenceHasCalendarEventKinds,
  type CalendarEventKind,
} from "../utils/activityCalendar"
import {
  getActivityOccurrences,
} from "../utils/activitySchedule"
import useCalendarDownload from "../hooks/useCalendarDownload"
import ActivityPerformanceDetails from "./ActivityPerformanceDetails"
import { getAttendanceKey } from "../utils/attendance"
import { toggleAttendance, useAttendance } from "../hooks/useAttendance"
import { instantFromSourceKey, sourceTimeZone } from "../utils/timeZone"

export default function AddToCalendar({ activity, lang, now }: {
  activity: Activity
  lang: Language
  now: string
}) {
  const { download, busy, failed } = useCalendarDownload(activity, lang, now)
  const [eventKinds, setEventKinds] = useState<CalendarEventKind[]>(["performance"])
  const [settingsOpen, setSettingsOpen] = useState(false)
  const settingsId = useId()
  const t = TRANSLATIONS[lang]
  const attending = useAttendance()
  const nowInstant = instantFromSourceKey(now, sourceTimeZone()) ?? Date.now()
  const occurrences = getCalendarOccurrences(activity, now)
  const availableEventKinds = getAvailableCalendarEventKinds(occurrences)
  const displayOccurrences = getActivityOccurrences(activity)
  const availableKeys = new Set(occurrences.map(getCalendarOccurrenceKey))
  const buttonClass = "inline-flex min-h-9 shrink-0 items-center justify-center gap-1.5 rounded-full border grid-line px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-coco-accent transition-colors hover:bg-coco-accent/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coco-accent disabled:opacity-50"
  const eventKindLabels: Record<CalendarEventKind, string> = {
    performance: activity.category === "Program" ? t.milestone_update : t.milestone_start,
    doors: t.milestone_doors,
    merch: t.milestone_merch,
    other: t.calendar_kind_other,
  }

  function toggleEventKind(kind: CalendarEventKind) {
    setEventKinds((current) => {
      if (!current.includes(kind)) return [...current, kind]
      if (current.length === 1) return current
      return current.filter((value) => value !== kind)
    })
  }

  return (
    <ActivityPerformanceDetails
      occurrences={displayOccurrences}
      lang={lang}
      startLabel={activity.category === "Program" ? t.milestone_update : undefined}
      actions={occurrences.length > 0 && <>
        <button type="button" disabled={busy} className={buttonClass}
          aria-label={t.calendar_add_all}
          onClick={() => download({ kind: "all", eventKinds })}>
          <CalendarPlus className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="sm:hidden">{t.calendar_add_all_short}</span>
          <span className="hidden sm:inline">{t.calendar_add_all}</span>
        </button>
        {availableEventKinds.length > 1 && (
          <button type="button" className={`${buttonClass} px-2.5 sm:px-3`}
            aria-expanded={settingsOpen} aria-controls={settingsId}
            aria-label={t.calendar_options} title={t.calendar_options}
            onClick={() => setSettingsOpen((open) => !open)}>
            <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="sr-only sm:not-sr-only">{t.calendar_options}</span>
          </button>
        )}
      </>}
      toolbarPanel={settingsOpen && availableEventKinds.length > 1 && (
        <fieldset id={settingsId} className="mt-3 rounded border grid-line bg-coco-ink/2.5 px-3 py-3 dark:bg-white/2.5">
          <legend className="sr-only">{t.calendar_options}</legend>
          <div className="flex flex-wrap gap-2">
            {availableEventKinds.map((kind) => {
              const selected = eventKinds.includes(kind)
              const lastSelected = selected && eventKinds.length === 1
              return (
                <label key={kind} className={`inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-coco-accent ${selected ? "border-coco-accent bg-coco-accent/8 text-coco-accent" : "grid-line text-coco-ink/55 hover:border-coco-accent/50"} ${lastSelected ? "cursor-default" : ""}`}>
                  <input type="checkbox" className="sr-only" checked={selected}
                    disabled={lastSelected} onChange={() => toggleEventKind(kind)} />
                  <span className={`flex h-4 w-4 items-center justify-center rounded border ${selected ? "border-coco-accent bg-coco-accent text-white" : "grid-line bg-white/50 dark:bg-black/10"}`} aria-hidden="true">
                    {selected && <Check className="h-3 w-3" strokeWidth={3} />}
                  </span>
                  {eventKindLabels[kind]}
                </label>
              )
            })}
          </div>
        </fieldset>
      )}
      renderPerformanceAction={(occurrence) => {
        const key = getCalendarOccurrenceKey(occurrence)
        const attendanceKey = getAttendanceKey(activity, occurrence)
        const saved = attendanceKey !== undefined && attending.has(attendanceKey)
        const canExport = availableKeys.has(key) && occurrenceHasCalendarEventKinds(occurrence, eventKinds)
        const canMark = attendanceKey !== undefined && (saved || occurrence.endInstant >= nowInstant)
        if (!canMark && !canExport) return null
        const label = [key.replace("T", " "), occurrence.label?.[lang]].filter(Boolean).join(" · ")
        return (
          <div className="flex flex-wrap gap-2">
            {canMark && <button type="button" aria-pressed={saved}
              aria-label={`${t.attendance_toggle} · ${label}`}
              className={`inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500 ${saved ? "border-violet-500/40 bg-violet-500/10 text-violet-700 dark:text-violet-300" : "grid-line text-coco-ink/65 hover:bg-violet-500/5"}`}
              onClick={() => toggleAttendance(attendanceKey)}>
              <Bookmark className={`h-3.5 w-3.5 ${saved ? "fill-current" : ""}`} aria-hidden="true" />
              {saved ? t.attendance_saved : t.attendance_toggle}
            </button>}
            {canExport && <button type="button" disabled={busy} className={buttonClass}
              aria-label={`${t.calendar_add_performance}: ${label}`}
              onClick={() => download({ kind: "performances", keys: [key], eventKinds })}>
              <CalendarPlus className="h-3.5 w-3.5" aria-hidden="true" />
              {t.calendar_add_performance}
            </button>}
          </div>
        )
      }}
      footer={<>
        {failed && <p role="alert" className="mt-2 text-xs text-coco-accent">{t.calendar_error}</p>}
      </>}
    />
  )
}
