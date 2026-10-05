import assert from "node:assert/strict"
import { after, test } from "node:test"
import { createServer } from "vite"
import yaml from "@modyfi/vite-plugin-yaml"

const server = await createServer({
  configFile: false,
  plugins: [yaml()],
  server: { middlewareMode: true, ws: false, watch: null },
  optimizeDeps: { noDiscovery: true, include: [] },
  appType: "custom",
})
after(() => server.close())

const zone = await server.ssrLoadModule("/src/utils/timeZone.ts")
const { getActivityDisplaySchedule } = await server.ssrLoadModule("/src/utils/activityDisplaySchedule.ts")
const { buildCalendarData } = await server.ssrLoadModule("/src/hooks/useCalendarEvents.ts")
const { getActivityStatus } = await server.ssrLoadModule("/src/utils/activityStatus.ts")
const { getTicketStatus, getTicketDisplaySchedule } = await server.ssrLoadModule("/src/utils/ticketStatus.ts")
const { buildActivityCalendar } = await server.ssrLoadModule("/src/utils/activityCalendar.ts")
const { getCalendarOccurrences } = await server.ssrLoadModule("/src/utils/activityCalendar.ts")
const { validateActivities } = await server.ssrLoadModule("/src/editor/activityValidation.ts")

const event = {
  id: "zone-test", category: "Program", scheduleLabel: "Test",
  title: { ja: "テスト", en: "Test" }, link: "https://example.com/test",
  performances: [{ startAt: "2026-09-12T00:30", milestones: [{ kind: "update", at: "00:15" }] }],
}

test("unqualified authored JST converts to the viewer's prior day, including milestones", () => {
  const calendar = buildCalendarData([event], undefined, "Asia/Shanghai")
  const day = calendar.find((month) => month.key === "2026-09")
    .weeks.flat().find((item) => item.date === "2026-09-11")
  assert.equal(day.events[0].startTime, "23:30")
  assert.equal(day.events[0].milestones[0].at, "23:15")
  assert.equal(zone.dateTimeForViewer(day.events[0].endInstant, "Asia/Shanghai"), "2026-09-12T01:00")
  assert.equal(getActivityDisplaySchedule(event, "Asia/Shanghai"), "2026-09-11")
})

test("activity summaries show dates only while detailed times stay timezone-aware", () => {
  const ranged = {
    ...event,
    performances: [
      { startAt: "2026-10-17T13:00" },
      { startAt: "2026-10-25T12:00" },
    ],
  }
  assert.equal(getActivityDisplaySchedule(ranged, "Asia/Shanghai"), "2026-10-17 – 2026-10-25")
})

test("recurring activity summaries defer entirely to scheduleLabel", () => {
  const recurring = {
    ...event,
    scheduleLabel: "Weekly",
    recurrence: { type: "manual" },
  }
  assert.equal(getActivityDisplaySchedule(recurring, "Asia/Shanghai"), null)
})

test("all-day dates stay on their authored calendar day", () => {
  const allDay = { ...event, performances: [{ occursOn: "2026-09-12" }] }
  const day = buildCalendarData([allDay], undefined, "America/Los_Angeles")[0]
    .weeks.flat().find((item) => item.date === "2026-09-12")
  assert.equal(day.events[0].startTime, undefined)
})

test("a declared Hong Kong source zone governs activity and ticket boundaries", () => {
  const hongKong = { ...event, timeZone: "Asia/Hong_Kong" }
  assert.equal(getActivityStatus(hongKong, "2026-09-12T01:00"), "upcoming")
  assert.equal(getActivityStatus(hongKong, "2026-09-12T01:30"), "ongoing")
  const entry = { startAt: "2026-09-12T00:30", scheduleLabel: "Sale" }
  assert.equal(getTicketStatus(entry, "2026-09-12T01:00", "Asia/Hong_Kong"), "upcoming")
  assert.equal(getTicketStatus(entry, "2026-09-12T01:30", "Asia/Hong_Kong"), "open")
  assert.equal(getTicketDisplaySchedule(entry, "Asia/Hong_Kong"),
    zone.dateTimeForViewer(zone.instantFromSourceKey(entry.startAt, "Asia/Hong_Kong")).replace("T", " "))
})

test("calendar export converts declared source zone into recipient zone", async () => {
  const hongKong = { ...event, timeZone: "Asia/Hong_Kong" }
  const ics = await buildActivityCalendar(hongKong, "en", {
    timeZone: "Asia/Tokyo", generatedAt: new Date("2026-09-01T00:00:00Z"),
  })
  assert.match(ics, /DTSTART;TZID=Asia\/Tokyo:20260912T013000/)
  assert.match(ics, /DTEND;TZID=Asia\/Tokyo:20260912T030000/)
})

test("DST gaps are rejected and repeated wall times resolve deterministically", () => {
  assert.equal(zone.instantFromSourceKey("2026-03-08T02:30", "America/New_York"), null)
  assert.equal(new Date(zone.instantFromSourceKey("2026-11-01T01:30", "America/New_York")).toISOString(),
    "2026-11-01T05:30:00.000Z")
  const invalid = { ...event, timeZone: "America/New_York", performances: [{ startAt: "2026-03-08T02:30" }] }
  assert.ok(validateActivities([invalid]).some((issue) => issue.path.endsWith("performances[0].startAt")))
  assert.ok(validateActivities([{ ...event, timeZone: "Mars/Olympus" }])
    .some((issue) => issue.path.endsWith("timeZone")))
  const weekly = { ...event, timeZone: "America/New_York", performances: undefined,
    recurrence: { type: "weekly", startOn: "2026-03-01", endOn: "2026-03-15",
      weekday: "sunday", startTime: "02:30" } }
  assert.ok(validateActivities([weekly]).some((issue) => issue.path.endsWith("recurrence.startTime")))
  assert.deepEqual(getCalendarOccurrences(weekly), [])
  const invalidMilestone = { ...event, timeZone: "America/New_York",
    performances: [{ startAt: "2026-03-08T03:30", milestones: [{ kind: "doors", at: "02:30" }] }] }
  assert.ok(validateActivities([invalidMilestone]).some((issue) => issue.path.endsWith("milestones[0].at")))
  assert.deepEqual(getCalendarOccurrences(invalidMilestone), [])
})
