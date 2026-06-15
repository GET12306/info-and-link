import { ChevronLeft, ChevronRight } from "lucide-react"
import type { CalendarMonthData, CalendarDay, CalendarEvent } from "../hooks/useCalendarEvents"
import type { Language } from "../types"

const DAY_LABELS_JA = ["日", "月", "火", "水", "木", "金", "土"]
const DAY_LABELS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

interface PopupState {
  day: CalendarDay
  x: number
  y: number
  placement: "above" | "below"
}

function formatMonthLabel(key: string, lang: Language): string {
  const [y, m] = key.split("-")
  const date = new Date(parseInt(y), parseInt(m) - 1)
  return new Intl.DateTimeFormat(lang === "ja" ? "ja-JP" : "en-US", {
    year: "numeric",
    month: "long",
  }).format(date)
}

const DETAIL_POPOVER_WIDTH = 320
const VIEWPORT_GUTTER = 8

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function supportsHover() {
  if (typeof window === "undefined") return false
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches
}

export default function CalendarMonth({
  month,
  lang,
  today,
  hoveredDay,
  onHoverDay,
  onLeaveDay,
  popup,
  onPopup,
  hasPrev,
  hasNext,
  onPrev,
  onNext,
  className = "",
}: {
  month: CalendarMonthData
  lang: Language
  today?: string
  hoveredDay: string | null
  onHoverDay: (date: string, events: CalendarEvent[], el: HTMLElement) => void
  onLeaveDay: () => void
  popup: PopupState | null
  onPopup: (p: PopupState | null) => void
  hasPrev: boolean
  hasNext: boolean
  onPrev: () => void
  onNext: () => void
  className?: string
}) {
  const labels = lang === "ja" ? DAY_LABELS_JA : DAY_LABELS_EN
  const isToday = today ?? ""

  const getPopoverPosition = (el: HTMLElement) => {
    const rect = el.getBoundingClientRect()
    const width = Math.min(DETAIL_POPOVER_WIDTH, window.innerWidth - VIEWPORT_GUTTER * 2)
    const x = clamp(
      rect.left + rect.width / 2 - width / 2,
      VIEWPORT_GUTTER,
      Math.max(VIEWPORT_GUTTER, window.innerWidth - width - VIEWPORT_GUTTER)
    )
    const placement: PopupState["placement"] = rect.top > window.innerHeight * 0.55 ? "above" : "below"
    const y = placement === "above" ? rect.top - 8 : rect.bottom + 8
    return { x, y, placement }
  }

  const handleClick = (day: CalendarDay, el: HTMLElement) => {
    if (day.events.length === 0) return
    onPopup({ day, ...getPopoverPosition(el) })
  }

  return (
    <div className={`border grid-line rounded p-4 bg-white dark:bg-neutral-900 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={onPrev}
          disabled={!hasPrev}
          className="p-1 rounded hover:bg-coco-accent/10 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="text-xs font-bold uppercase tracking-widest text-coco-accent">
          {formatMonthLabel(month.key, lang)}
        </div>
        <button
          onClick={onNext}
          disabled={!hasNext}
          className="p-1 rounded hover:bg-coco-accent/10 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
          aria-label="Next month"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-0">
        {labels.map((label, i) => (
          <div key={i} className="text-[10px] text-center font-medium opacity-40 pb-2">
            {label}
          </div>
        ))}

        {month.weeks.flat().map((day, i) => {
          const isTodayDay = day.date === isToday
          const hasEvents = day.events.length > 0

          return (
            <div
              key={i}
              className={`relative flex items-center justify-center h-8 text-xs ${
                hasEvents ? "cursor-pointer" : ""
              }`}
              onMouseEnter={(e) => {
                if (hasEvents && supportsHover()) {
                  onHoverDay(day.date!, day.events, e.currentTarget)
                }
              }}
              onMouseLeave={onLeaveDay}
              onClick={(e) => handleClick(day, e.currentTarget)}
            >
              {day.dayNumber !== null && (
                <div className="flex flex-col items-center">
                  <span
                    className={`relative leading-none transition-colors rounded-full w-7 h-7 flex items-center justify-center ${
                      isTodayDay
                        ? "bg-coco-accent text-white font-bold shadow-sm"
                        : hasEvents
                          ? "font-bold text-coco-accent"
                          : "text-coco-ink/60"
                    }`}
                  >
                    {day.dayNumber}
                    {isTodayDay && hasEvents && (
                      <span className="absolute bottom-1 w-1 h-1 rounded-full bg-white/90" />
                    )}
                  </span>
                  {hasEvents && !isTodayDay && (
                    <span className="w-1 h-1 bg-coco-accent rounded-full mt-0.5" />
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
