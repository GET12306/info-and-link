import { useEffect, useMemo, useState } from "react"
import type { Activity, Language } from "../types"
import { buildCalendarData } from "../hooks/useCalendarEvents"
import CalendarMonth from "./CalendarMonth"

export default function HistoricalActivityCalendar({
  activities,
  lang,
  onSelectActivity,
}: {
  activities: Activity[]
  lang: Language
  onSelectActivity: (activityId: string) => void
}) {
  const months = useMemo(() => buildCalendarData(activities), [activities])
  const monthKeys = months.map((month) => month.key)
  const [monthKey, setMonthKey] = useState(() => monthKeys.at(-1) ?? "")

  useEffect(() => {
    if (!monthKeys.includes(monthKey)) setMonthKey(monthKeys.at(-1) ?? "")
  }, [monthKey, monthKeys])

  const monthIndex = Math.max(0, monthKeys.indexOf(monthKey))
  const month = months[monthIndex]
  if (!month) return null

  return <CalendarMonth
    month={month}
    lang={lang}
    activities={activities}
    onSelectEvent={onSelectActivity}
    eventActionLabel={lang === "ja" ? "活動記録へ" : "View archived event"}
    hasPrev={monthIndex > 0}
    hasNext={monthIndex < months.length - 1}
    onPrev={() => setMonthKey(monthKeys[monthIndex - 1])}
    onNext={() => setMonthKey(monthKeys[monthIndex + 1])}
    monthKeys={monthKeys}
    onSelectMonth={setMonthKey}
  />
}
