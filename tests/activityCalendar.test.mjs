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
const {
  getAvailableCalendarEventKinds,
  getCalendarOccurrences,
  buildActivityCalendar,
  occurrenceHasCalendarEventKinds,
} = await server.ssrLoadModule("/src/utils/activityCalendar.ts")
const { compareActivitiesByStart } = await server.ssrLoadModule("/src/utils/activityStatus.ts")
const { getNextActivityOccurrence } = await server.ssrLoadModule("/src/utils/activitySchedule.ts")
const activity = {
  id: "test-live", category: "Live", scheduleLabel: "Display only", title: { ja: "ライブ", en: "Live" },
  link: "https://example.com/event", venueIds: ["theater-sunmall"],
  performances: [{ startAt: "2026-09-12T00:30" }],
}
const options = {
  generatedAt: new Date("2026-09-05T00:00:00Z"),
  timeZone: "Asia/Tokyo",
}
const unfold = (value) => value.replace(/\r\n /g, "")

test("current activity categories put chronological one-time events before stable recurring entries", () => {
  const sorted = [
    { ...activity, id: "unknown", performances: undefined },
    { ...activity, id: "recurring-first", recurrence: { type: "manual" } },
    { ...activity, id: "later", performances: [{ startAt: "2026-09-12T18:00" }] },
    { ...activity, id: "recurring-second", recurrence: { type: "manual" } },
    { ...activity, id: "earlier", performances: [{ startAt: "2026-09-12T12:00" }] },
    { ...activity, id: "all-day", performances: [{ occursOn: "2026-09-11" }] },
  ].sort(compareActivitiesByStart)

  assert.deepEqual(sorted.map(({ id }) => id), [
    "all-day",
    "earlier",
    "later",
    "recurring-first",
    "recurring-second",
    "unknown",
  ])
})

test("recurring activity display keeps today's update and otherwise selects only the next date", () => {
  const recurring = {
    ...activity,
    recurrence: { type: "manual" },
    performances: [
      { occursOn: "2026-09-10" },
      { occursOn: "2026-09-12" },
      { startAt: "2026-09-19T22:00" },
    ],
  }

  assert.equal(
    getNextActivityOccurrence(recurring, "2026-09-12T23:30")?.date,
    "2026-09-12"
  )
  assert.equal(
    getNextActivityOccurrence(recurring, "2026-09-13T00:00")?.date,
    "2026-09-19"
  )
  assert.equal(
    getNextActivityOccurrence(recurring, "2026-09-20T00:00"),
    null
  )
})

test("explicit selections export only the chosen shows", async () => {
  const event = { ...activity, performances: [
    { startAt: "2026-09-12T12:00", milestones: [{ kind: "merch", at: "10:00" }] },
    { startAt: "2026-09-12T18:00", milestones: [{ kind: "doors", at: "17:30" }] },
    { startAt: "2026-09-13T18:00" },
  ] }
  const single = unfold(await buildActivityCalendar(event, "en", { ...options,
    selection: { kind: "performances", keys: ["2026-09-12T18:00"] } }))
  assert.equal(single.match(/BEGIN:VEVENT/g).length, 1)
  assert.match(single, /DTSTART;TZID=Asia\/Tokyo:20260912T180000/)
  assert.doesNotMatch(single, /DESCRIPTION|20260912T120000/)
  const subset = await buildActivityCalendar(event, "en", { ...options,
    selection: { kind: "performances", keys: ["2026-09-12T12:00", "2026-09-13T18:00"] } })
  assert.equal(subset.match(/BEGIN:VEVENT/g).length, 2)
  assert.equal((await buildActivityCalendar(event, "en", { ...options, selection: { kind: "all" } })).match(/BEGIN:VEVENT/g).length, 3)
  assert.equal(await buildActivityCalendar(event, "en", { selection: { kind: "performances", keys: [] } }), null)
})

test("automatic readiness and manual overrides require real dates", () => {
  assert.equal(getCalendarOccurrences(activity).length, 1)
  const dateOnly = { ...activity, performances: [{ occursOn: "2026-09-12" }] }
  assert.equal(getCalendarOccurrences(dateOnly).length, 0)
  assert.equal(getCalendarOccurrences({ ...dateOnly, calendarExport: "enabled" }).length, 1)
  assert.equal(getCalendarOccurrences({ ...activity, calendarExport: "disabled" }).length, 0)
  assert.equal(getCalendarOccurrences({ ...activity, performances: [], calendarExport: "enabled" }).length, 0)
  assert.equal(getCalendarOccurrences({ ...activity, performances: [...activity.performances, { occursOn: "2026-09-13" }] }).length, 0)
})

test("invalid or contradictory data cannot silently produce a partial calendar", () => {
  for (const overrides of [
    { performances: [{ startAt: "2026-02-30T12:00" }] },
    { performances: [{ startAt: "2026-09-12T25:00" }] },
    { performances: [{ startAt: "2026-09-12" }] },
    { performances: [...activity.performances, { startAt: "invalid" }] },
    { performances: [...activity.performances, ...activity.performances] },
    { performances: [{ startAt: "2026-09-12T00:30", endAt: "2026-09-12T00:15" }] },
    { performances: [{ startAt: "2026-09-12T00:30", endAt: "2026-09-12T00:30" }] },
    { startDate: "2026-09-12" },
    { durationMinutes: -10 }, { durationMinutes: Infinity },
    { link: "javascript:alert(1)" }, { title: { ja: "", en: "" } },
    { performances: [], startDate: "2026-09-12", endDate: "2026-09-11" },
  ]) assert.equal(getCalendarOccurrences({ ...activity, calendarExport: "enabled", ...overrides }).length, 0, JSON.stringify(overrides))
})

test("JST converts to the downloader's timezone and default duration is 90 minutes", async () => {
  const ics = unfold(await buildActivityCalendar(activity, "en", {
    ...options,
    timeZone: "America/Los_Angeles",
  }))
  assert.match(ics, /X-WR-TIMEZONE:America\/Los_Angeles/)
  assert.match(ics, /BEGIN:VTIMEZONE/)
  assert.match(ics, /TZOFFSETTO:-0700/)
  assert.match(ics, /TZOFFSETTO:-0800/)
  assert.match(ics, /DTSTART;TZID=America\/Los_Angeles:20260911T083000/)
  assert.match(ics, /DTEND;TZID=America\/Los_Angeles:20260911T100000/)
  assert.doesNotMatch(ics, /DESCRIPTION|DURATION|RRULE/)
  assert.match(ics, /LOCATION:Theater Sunmall/)
  assert.match(ics, /URL:https:\/\/example.com\/event/)
  assert.equal(ics.match(/URL:https:\/\/example.com\/event/g)?.length, 1)
})

test("explicit end overrides shared duration; duration may cross midnight", async () => {
  const event = { ...activity, durationMinutes: 120, performances: [{ startAt: "2026-12-31T23:30" }] }
  assert.match(await buildActivityCalendar(event, "en", options), /DTEND;TZID=Asia\/Tokyo:20270101T013000/)
  event.performances[0].endAt = "2027-01-01T02:30"
  assert.match(await buildActivityCalendar(event, "en", options), /DTEND;TZID=Asia\/Tokyo:20270101T023000/)
})

test("all-day export uses an exclusive end date across a year boundary", async () => {
  const event = { ...activity, calendarExport: "enabled", performances: [{ occursOn: "2026-12-31" }] }
  const ics = unfold(await buildActivityCalendar(event, "en", options))
  assert.match(ics, /DTSTART;VALUE=DATE:20261231/)
  assert.match(ics, /DTEND;VALUE=DATE:20270101/)
  assert.doesNotMatch(ics, /DESCRIPTION/)
  const range = { ...event, performances: undefined, startDate: "2026-12-31", endDate: "2027-01-02" }
  assert.equal((await buildActivityCalendar(range, "ja", options)).match(/BEGIN:VEVENT/g).length, 3)
})

test("milestones do not change their parent performance's all-day or duration semantics", async () => {
  const allDay = {
    ...activity,
    calendarExport: "enabled",
    performances: [{
      occursOn: "2026-09-12",
      milestones: [{ kind: "update", at: "12:00" }],
    }],
  }
  const [allDayOccurrence] = getCalendarOccurrences(allDay)
  assert.equal(allDayOccurrence.allDay, true)
  assert.equal(allDayOccurrence.startAt, undefined)
  assert.equal(allDayOccurrence.endAt, "2026-09-12T23:59")

  const allDayIcs = unfold(await buildActivityCalendar(allDay, "en", options))
  assert.match(allDayIcs, /DTSTART;VALUE=DATE:20260912/)
  assert.doesNotMatch(allDayIcs, /DESCRIPTION|Additional times|Update 12:00/)
  assert.doesNotMatch(allDayIcs, /DTSTART:20260912T/)

  const timed = {
    ...activity,
    durationMinutes: 120,
    performances: [{
      startAt: "2026-09-12T18:00",
      milestones: [
        { kind: "merch", at: "14:00", until: "16:30" },
        { kind: "doors", at: "17:00" },
      ],
    }],
  }
  const [timedOccurrence] = getCalendarOccurrences(timed)
  assert.equal(timedOccurrence.endAt, "2026-09-12T20:00")
  const timedIcs = unfold(await buildActivityCalendar(timed, "en", options))
  assert.doesNotMatch(timedIcs, /DESCRIPTION|Merch|Doors/)
  assert.match(timedIcs, /DTEND;TZID=Asia\/Tokyo:20260912T200000/)
})

test("calendar settings export milestone events with venue, URL, and the intended durations", async () => {
  const event = {
    ...activity,
    performances: [{
      startAt: "2026-09-12T18:00",
      label: { ja: "夜公演", en: "Evening" },
      milestones: [
        { kind: "merch", at: "14:00", until: "16:30" },
        { kind: "doors", at: "17:00" },
        {
          kind: "other",
          at: "20:30",
          label: { ja: "お見送り", en: "Send-off" },
        },
      ],
    }],
  }
  const [occurrence] = getCalendarOccurrences(event)
  assert.deepEqual(
    getAvailableCalendarEventKinds([occurrence]),
    ["performance", "doors", "merch", "other"]
  )
  assert.equal(occurrenceHasCalendarEventKinds(occurrence, ["doors"]), true)
  assert.equal(occurrenceHasCalendarEventKinds(occurrence, []), false)

  const ics = unfold(await buildActivityCalendar(event, "en", {
    ...options,
    selection: {
      kind: "all",
      eventKinds: ["doors", "merch", "other"],
    },
  }))
  assert.equal(ics.match(/BEGIN:VEVENT/g).length, 3)
  assert.match(ics, /SUMMARY:Live — Evening — Merch/)
  assert.match(ics, /DTSTART;TZID=Asia\/Tokyo:20260912T140000\r\nDTEND;TZID=Asia\/Tokyo:20260912T163000/)
  assert.match(ics, /SUMMARY:Live — Evening — Doors/)
  assert.match(ics, /DTSTART;TZID=Asia\/Tokyo:20260912T170000\r\nDTEND;TZID=Asia\/Tokyo:20260912T180000/)
  assert.match(ics, /SUMMARY:Live — Evening — Send-off/)
  assert.match(ics, /DTSTART;TZID=Asia\/Tokyo:20260912T203000\r\nDTEND;TZID=Asia\/Tokyo:20260912T213000/)
  assert.equal(ics.match(/URL:https:\/\/example.com\/event/g).length, 3)
  assert.equal(ics.match(/LOCATION:Theater Sunmall/g).length, 3)
  assert.equal(ics.match(/Sunmall Crest B1/g).length, 3)
  assert.doesNotMatch(ics, /DESCRIPTION/)
  assert.equal(await buildActivityCalendar(event, "en", {
    ...options,
    selection: { kind: "all", eventKinds: [] },
  }), null)
})

test("invalid milestones block calendar export instead of being partially omitted", () => {
  for (const milestones of [
    [{ kind: "update", at: "24:00" }],
    [{ kind: "merch", at: "15:00", until: "14:00" }],
    [{ kind: "other", at: "13:45" }],
    [{ kind: "other", at: "13:45", label: { ja: "整列開始", en: "" } }],
    [{ kind: "unknown", at: "12:00" }],
  ]) {
    assert.equal(
      getCalendarOccurrences({
        ...activity,
        calendarExport: "enabled",
        performances: [{ startAt: "2026-09-12T18:00", milestones }],
      }).length,
      0,
      JSON.stringify(milestones)
    )
  }
})

test("only unexpired known performances are exported; a single performance can be selected", async () => {
  const event = { ...activity, recurrence: { type: "manual" }, performances: [
    { startAt: "2026-09-01T12:00" }, { startAt: "2026-09-12T12:00" }, { startAt: "2026-09-12T18:00" },
  ] }
  const selection = { ...options, now: "2026-09-05T12:00" }
  const ics = await buildActivityCalendar(event, "en", selection)
  assert.equal(ics.match(/BEGIN:VEVENT/g).length, 2)
  assert.doesNotMatch(ics, /RRULE|20260901T/)
  assert.equal((await buildActivityCalendar(event, "en", { ...selection, occurrenceKey: "2026-09-12T18:00" })).match(/BEGIN:VEVENT/g).length, 1)
  assert.equal(await buildActivityCalendar(event, "en", { ...selection, now: "2027-01-01T00:00" }), null)
})

test("weekly recurrence generates only its bounded range and applies time or cancellation overrides", () => {
  const event = {
    ...activity,
    category: "Program",
    performances: undefined,
    recurrence: {
      type: "weekly",
      startOn: "2026-09-01",
      endOn: "2026-09-30",
      weekday: "friday",
      startTime: "22:00",
      overrides: [
        { date: "2026-09-18", startTime: "21:30" },
        { date: "2026-09-25", cancelled: true },
      ],
    },
  }
  assert.deepEqual(
    getCalendarOccurrences(event).map((occurrence) => occurrence.startAt),
    ["2026-09-04T22:00", "2026-09-11T22:00", "2026-09-18T21:30"]
  )
})

test("UTF-8 folding and CRLF preserve long Japanese titles without descriptions", async () => {
  const title = "鼓子🎵".repeat(40)
  const event = { ...activity, title: { ja: title, en: title }, description: { ja: "one,two;three\\four\r\nBEGIN:VEVENT", en: "" } }
  const ics = await buildActivityCalendar(event, "ja", options)
  for (const line of ics.split("\r\n")) assert.ok(Buffer.byteLength(line) <= 75)
  assert.doesNotMatch(ics.replace(/\r\n/g, ""), /[\r\n]/)
  assert.doesNotMatch(unfold(ics), /DESCRIPTION|one\\,two|BEGIN:VEVENT.*BEGIN:VEVENT/s)
  assert.ok(unfold(ics).includes(`SUMMARY:${title}\r\n`))
  assert.equal(ics.split("\r\n").filter((line) => line === "BEGIN:VEVENT").length, 1)
})

test("UIDs are deterministic across language, metadata changes, download time and performance order", async () => {
  const getUids = (ics) => unfold(ics).match(/UID:[^\r]+/g).sort()
  const event = { ...activity, performances: [...activity.performances, { startAt: "2026-09-13T12:00" }] }
  const first = getUids(await buildActivityCalendar(event, "en", options))
  const second = getUids(await buildActivityCalendar({ ...event, performances: [...event.performances].reverse() }, "ja"))
  const afterMetadataChange = getUids(await buildActivityCalendar({
    ...event,
    title: { ja: "変更後", en: "Renamed" },
    link: "https://example.com/new-source",
  }, "en", options))
  assert.deepEqual(first, second)
  assert.deepEqual(first, afterMetadataChange)
  assert.equal(new Set(first).size, 2)
})
