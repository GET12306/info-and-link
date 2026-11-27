import assert from "node:assert/strict"
import { after, test } from "node:test"
import { createServer } from "vite"

const server = await createServer({
  configFile: false,
  server: { middlewareMode: true, ws: false, watch: null },
  optimizeDeps: { noDiscovery: true, include: [] },
  appType: "custom",
})
after(() => server.close())

const { findNextActivity } = await server.ssrLoadModule("/src/utils/nextActivity.ts")
const { getActivityOccurrences } = await server.ssrLoadModule("/src/utils/activitySchedule.ts")
const { getAttendanceKey } = await server.ssrLoadModule("/src/utils/attendance.ts")
const { buildCalendarData } = await server.ssrLoadModule("/src/hooks/useCalendarEvents.ts")
const { toggleAttendance } = await server.ssrLoadModule("/src/hooks/useAttendance.ts")

const show = {
  id: "show", category: "Stage", title: { ja: "公演", en: "Show" }, link: "https://example.com/show",
  performances: [
    { id: "matinee", startAt: "2026-11-27T11:00" },
    { id: "evening", startAt: "2026-11-27T19:00" },
  ],
}

test("the home summary skips an ongoing timed show and routine updates, but includes manually confirmed appearances", () => {
  const now = Date.parse("2026-11-27T11:30+09:00")
  const weekly = {
    ...show, id: "weekly", category: "Program", performances: [],
    recurrence: { type: "weekly", startOn: "2026-11-27", endOn: "2026-12-04", weekday: "friday", startTime: "12:00" },
  }
  const manual = {
    ...weekly, id: "manual", recurrence: { type: "manual" }, performances: [{ startAt: "2026-11-27T16:00" }],
  }
  assert.equal(findNextActivity([weekly, show], now).occurrence.id, "evening")
  assert.equal(findNextActivity([weekly, show, manual], now).activity.id, "manual")
  assert.equal(findNextActivity([weekly], now), undefined)
})

test("one attendance mark follows a rescheduled performance and its calendar slot across time zones", () => {
  const key = getAttendanceKey(show, getActivityOccurrences(show)[1])
  const rescheduled = {
    ...show,
    performances: [{ id: "evening", startAt: "2026-11-28T00:30" }, ...show.performances.slice(0, 1)],
  }
  const events = buildCalendarData([rescheduled], undefined, "Asia/Hong_Kong").flatMap(month =>
    month.weeks.flatMap(week => week.flatMap(day => day.events))
  )
  assert.equal(events[1].attendanceKey, key)
  assert.notEqual(events[0].attendanceKey, key)
  assert.equal(events[1].date, "2026-11-27")
  const recurring = { ...show, recurrence: { type: "manual" } }
  assert.equal(getAttendanceKey(recurring, getActivityOccurrences(recurring)[1]), undefined)
})

test("attendance toggles persist a single slot and allow that selection to be removed", () => {
  const localStorage = new Map()
  const win = new EventTarget()
  win.localStorage = {
    getItem: (key) => localStorage.get(key) ?? null,
    setItem: (key, value) => localStorage.set(key, value),
  }
  const previous = globalThis.window
  globalThis.window = win
  try {
    toggleAttendance("show/id:evening")
    toggleAttendance("show/id:matinee")
    toggleAttendance("show/id:evening")
    assert.deepEqual(JSON.parse(localStorage.get("activity-attendance-v1")), ["show/id:matinee"])
  } finally {
    if (previous === undefined) delete globalThis.window
    else globalThis.window = previous
  }
})
