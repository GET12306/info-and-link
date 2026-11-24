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
  assert.equal(getActivityDisplaySchedule(event, "Asia/Shanghai"), "2026.09.11")
})

test("activity summaries show dates only while detailed times stay timezone-aware", () => {
  const ranged = {
    ...event,
    performances: [
      { startAt: "2026-10-17T13:00" },
      { startAt: "2026-10-25T12:00" },
    ],
  }
  assert.equal(getActivityDisplaySchedule(ranged, "Asia/Shanghai"), "2026.10.17 – 2026.10.25")
})

test("recurring activity summaries preserve update frequency instead of episode dates", () => {
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
    zone.dateTimeForViewer(zone.instantFromSourceKey(entry.startAt, "Asia/Hong_Kong")).replace(/-/g, ".").replace("T", " "))
})

test("scheduleLabel is a conditional fallback for activities and ticket entries", () => {
  const { scheduleLabel, ...dated } = event
  assert.equal(validateActivities([dated]).filter(issue => issue.path.endsWith('.scheduleLabel')).length, 0)
  const undated = { ...dated, performances: undefined }
  assert.ok(validateActivities([undated]).some(issue => issue.path === 'activities[0].scheduleLabel'))
  assert.ok(!validateActivities([{ ...undated, scheduleLabel: 'Date TBA' }]).some(issue => issue.path.endsWith('.scheduleLabel')))
  for (const boundary of [{ startAt: '2026-11-21' }, { endAt: '2026-11-22T23:59' }, { startAt: '2026-11-21', endAt: '2026-11-22' }]) {
    const activity = { ...dated, ticketInfo: { entries: [{ type: { ja: '一般', en: 'Sale' }, ...boundary }] } }
    assert.ok(!validateActivities([activity]).some(issue => issue.path.endsWith('.scheduleLabel')))
  }
  const ticket = { type: { ja: '一般', en: 'Sale' } }
  assert.ok(validateActivities([{ ...dated, ticketInfo: { entries: [ticket] } }]).some(issue => issue.path.endsWith('entries[0].scheduleLabel')))
  assert.ok(!validateActivities([{ ...dated, ticketInfo: { entries: [{ ...ticket, scheduleLabel: 'TBA' }] } }]).some(issue => issue.path.endsWith('.scheduleLabel')))
  assert.equal(getTicketDisplaySchedule({ startAt: '2026-11-21', endAt: '2026-11-22', scheduleLabel: 'Ignored' }), '2026.11.21 – 2026.11.22')
  assert.equal(getTicketDisplaySchedule({ scheduleLabel: 'TBA' }), null)
  assert.equal(getActivityDisplaySchedule({ ...undated, endDate: '2026-11-22' }), '2026.11.22')
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

test("repeated conversions reuse validation and immutable instants without mixing time zones", () => {
  const Native = Intl.DateTimeFormat
  let constructors = 0
  let conversions = 0
  Intl.DateTimeFormat = function (...args) { constructors++; return new Native(...args) }
  Intl.DateTimeFormat.prototype = Native.prototype
  const original = Native.prototype.formatToParts
  Native.prototype.formatToParts = function (...args) { conversions++; return original.apply(this, args) }
  try {
    const value = "2031-08-09T12:34"
    const first = zone.instantFromSourceKey(value, "Pacific/Chatham")
    assert.ok(Number.isFinite(first))
    const firstConstructors = constructors
    const firstConversions = conversions
    for (let index = 0; index < 20; index++) assert.equal(zone.instantFromSourceKey(value, "Pacific/Chatham"), first)
    assert.equal(constructors, firstConstructors)
    assert.equal(conversions, firstConversions)
    assert.notEqual(zone.instantFromSourceKey(value, "Asia/Tokyo"), first)
    assert.notEqual(zone.instantFromSourceKey("2031-08-09T12:35", "Pacific/Chatham"), first)
    assert.equal(zone.isValidTimeZone("Mars/Olympus"), false)
    assert.equal(zone.isValidTimeZone(""), false)
  } finally {
    Intl.DateTimeFormat = Native
    Native.prototype.formatToParts = original
  }
})
