import { useState } from "react"
import type { Activity, Language } from "../types"
import { buildActivityCalendar, type CalendarSelection } from "../utils/activityCalendar"

// Browser file delivery is shared by all calendar selections.
export default function useCalendarDownload(activity: Activity, lang: Language, now: string) {
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  async function download(selection: CalendarSelection) {
    setBusy(true)
    setFailed(false)
    try {
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
      const calendar = await buildActivityCalendar(activity, lang, { now, selection, timeZone })
      if (!calendar) throw new Error("No exportable dates")
      const url = URL.createObjectURL(new Blob([calendar], { type: "text/calendar;charset=utf-8" }))
      const anchor = document.createElement("a")
      anchor.href = url
      const title = activity.title[lang].replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-").slice(0, 80)
      anchor.download = `${title}-${(selection.kind === "performances" && selection.keys.length === 1 ? selection.keys[0] : "all").replace(/:/g, "")}.ics`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      // Allow the browser to consume the blob before releasing it.
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch {
      setFailed(true)
    } finally {
      setBusy(false)
    }
  }

  return { download, busy, failed }
}
