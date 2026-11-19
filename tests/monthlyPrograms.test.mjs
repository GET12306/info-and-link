import assert from "node:assert/strict"
import { after, test } from "node:test"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { createServer } from "vite"
import yaml from "@modyfi/vite-plugin-yaml"
import { parse, stringify } from "yaml"

const server = await createServer({ configFile: false, plugins: [yaml()], esbuild: { jsx: "automatic" }, ssr: { resolve: { conditions: ["module"] }, noExternal: ["react-router-dom", "react-router"] }, server: { middlewareMode: true, ws: false, watch: null }, optimizeDeps: { noDiscovery: true, include: [] }, appType: "custom" })
after(() => server.close())
const { default: activities } = await server.ssrLoadModule("/src/data/activities.ts")
const { monthlyDate, getMonthlyPerformances, monthlyRuleIssues } = await server.ssrLoadModule("/src/utils/monthlySchedule.ts")
const { getProgramEpisodes, programArchivePath } = await server.ssrLoadModule("/src/utils/programEpisodes.ts")
const { buildCalendarData } = await server.ssrLoadModule("/src/hooks/useCalendarEvents.ts")
const { getActivityOccurrences } = await server.ssrLoadModule("/src/utils/activitySchedule.ts")
const { validateActivities } = await server.ssrLoadModule("/src/editor/activityValidation.ts")
const { RecurrenceEditor } = await server.ssrLoadModule("/src/editor/ActivityScheduleEditor.tsx")
const { default: Programs } = await server.ssrLoadModule("/src/pages/Programs.tsx")
const { default: CalendarMonth } = await server.ssrLoadModule("/src/components/CalendarMonth.tsx")
const { MemoryRouter } = await server.ssrLoadModule("react-router-dom")
const currentProgram = activities.find(activity => activity.id === "lovelive-discover-radio")
// A bounded fixture must not change when the author extends the real schedule.
const program = { ...currentProgram, recurrence: { ...currentProgram.recurrence, endMonth: "2027-01" } }
const now = Date.parse("2026-10-26T03:00:00Z")
const events = months => months.flatMap(month => month.weeks.flat().flatMap(day => day.events))
const other = (id, date) => ({ id, category: "Event", scheduleLabel: date, title: { ja: id, en: id }, link: "https://example.com", performances: [{ occursOn: date }] })
const render = element => renderToStaticMarkup(createElement(MemoryRouter, null, element))

test("Discover Radio uses the common monthly rule and preserves all authored dates and update times", () => {
  assert.equal(program.recurrence.type, "monthly")
  assert.equal(program.recurrence.endMonth, "2027-01")
  assert.equal(program.program.display, "episodes")
  assert.deepEqual(validateActivities(activities), [])
  const performances = getMonthlyPerformances(program)
  assert.deepEqual(performances.map(item => item.occursOn), ["2026-07-02", "2026-08-06", "2026-09-03", "2026-10-01", "2026-11-05", "2026-12-03", "2027-01-07"])
  assert.deepEqual(performances.map(item => item.episode), ["1", "2", "3", "4", "5", "6", "7"])
  for (const item of performances) {
    assert.equal(item.startAt, undefined)
    assert.ok(item.milestones.some(milestone => milestone.kind === "update" && milestone.at === "12:00"))
  }
  assert.deepEqual(program.performances.map(item => item.occursOn), ["2026-09-03", "2026-10-01", "2026-11-05", "2026-12-03", "2027-01-07"])
  assert.ok(getActivityOccurrences(program).every(item => item.allDay && item.endAt.endsWith("T23:59")))
})

test("monthly dates handle year boundaries, leap years and missing fifth weekdays", () => {
  assert.equal(monthlyDate("2027-01", "thursday", 1), "2027-01-07")
  assert.equal(monthlyDate("2028-02", "thursday", 1), "2028-02-03")
  assert.equal(monthlyDate("2028-03", "thursday", 1), "2028-03-02")
  assert.equal(monthlyDate("2026-02", "thursday", 5), null)
})

test("rescheduling and cancellation replace the original slot, retain its episode and merge optional metadata", () => {
  const saved = structuredClone(program)
  saved.performances.find(item => item.occursOn === "2026-10-01").link = "https://example.com/episode-4"
  saved.recurrence.overrides = [{ date: "2026-10-01", occursOn: "2026-10-08", updateTime: "14:30" }, { date: "2026-11-05", cancelled: true }]
  const before = JSON.stringify(saved)
  const performances = getMonthlyPerformances(saved)
  assert.equal(performances.some(item => item.occursOn === "2026-10-01" || item.occursOn === "2026-11-05"), false)
  const moved = performances.find(item => item.occursOn === "2026-10-08")
  assert.equal(moved.episode, "4")
  assert.equal(moved.link, "https://example.com/episode-4")
  assert.equal(moved.milestones.find(item => item.kind === "update").at, "14:30")
  assert.equal(performances.find(item => item.occursOn === "2026-12-03").episode, "6")
  assert.equal(JSON.stringify(saved), before)
})

test("monthly episodes populate home months without needing other activities", () => {
  const calendar = buildCalendarData([program], "2026-10-26", "Asia/Tokyo", now)
  assert.deepEqual(calendar.map(month => month.key), ["2026-10", "2026-11", "2026-12", "2027-01"])
  assert.deepEqual(events(calendar).map(event => event.date), ["2026-10-01", "2026-11-05", "2026-12-03", "2027-01-07"])
})

test("only manually extending the rule generates additional monthly episodes", () => {
  const otherActivity = other("future", "2027-03-20")
  const calendar = buildCalendarData([otherActivity, program], "2026-10-26", "Asia/Tokyo", now)
  assert.equal(calendar.at(-1).key, "2027-03")
  assert.equal(events(calendar).filter(event => event.activityId === program.id).at(-1).date, "2027-01-07")
  const extended = { ...program, recurrence: { ...program.recurrence, endMonth: "2027-03" } }
  assert.equal(getMonthlyPerformances(extended).at(-1).occursOn, "2027-03-04")
  assert.equal(getMonthlyPerformances(extended).at(-1).episode, "9")
  assert.equal(getProgramEpisodes(program, Date.parse("2028-01-01T00:00:00Z")).length, 7)
})

test("a special episode beyond the end month does not extend the regular rule", () => {
  const extra = { startAt: "2027-03-20T18:00", episode: "SP" }
  const activity = { ...program, performances: [...program.performances, extra],
    recurrence: { ...program.recurrence, overrides: [{ date: "2027-01-07", occursOn: "2027-02-04" }] } }
  assert.deepEqual(validateActivities([activity]), [])
  assert.deepEqual(getMonthlyPerformances(activity).slice(-2).map(item => [item.episode, item.startAt ?? item.occursOn]), [
    ["7", "2027-02-04"], ["SP", "2027-03-20T18:00"],
  ])
})

test("the museum collects only updates that have actually reached 12:00, not future predicted episodes", () => {
  assert.deepEqual(getProgramEpisodes(program, now).map(item => item.episode), ["4", "3", "2", "1"])
  assert.deepEqual(getProgramEpisodes(program, Date.parse("2026-10-01T02:59:00Z")).map(item => item.episode), ["3", "2", "1"])
  assert.deepEqual(getProgramEpisodes(program, Date.parse("2026-10-01T03:00:00Z")).map(item => item.episode), ["4", "3", "2", "1"])
  assert.deepEqual(getProgramEpisodes(program, Date.parse("2026-07-02T02:59:00Z")), [])
})

test("monthly calendar entries are red before publication and neutral clickable records after publication", () => {
  for (const published of [false, true]) {
    const current = Date.parse(published ? "2026-10-01T03:00:00Z" : "2026-10-01T02:59:00Z")
    const month = buildCalendarData([program], undefined, "Asia/Tokyo", current).find(item => item.key === "2026-10")
    const event = events([month]).find(item => item.date === "2026-10-01")
    assert.equal(Boolean(event.archivePath), published)
    if (published) assert.equal(event.archivePath, programArchivePath(program.id, "2026-10-01"))
    const html = render(createElement(CalendarMonth, { month, lang: "en", now: published ? "2026-10-01T12:00" : "2026-10-01T11:59", activities: [program], onSelectEvent() {}, hasPrev: false, hasNext: false, onPrev() {}, onNext() {}, months: [month], onSelectMonth() {} }))
    const cards = html.match(/<button[^>]*aria-label="[^"]*Discover Broadcast Room[^"]*"[^>]*>/g) ?? []
    assert.equal(cards.length, 2)
    assert.ok(cards.every(card => !card.includes("disabled")))
    assert.ok(cards.every(card => card.includes(published ? "border-coco-ink/20" : "border-coco-accent")))
  }
})

test("the editor exposes monthly rules, override controls, and the museum lists the broadcast", () => {
  const html = render(createElement(RecurrenceEditor, { recurrence: { ...program.recurrence, overrides: [{ date: "2026-11-05" }] }, onChange() {} }))
  for (const key of ["startOn", "endMonth", "weekday", "weekOfMonth", "updateTime", "firstEpisode", "overrides[].date", "overrides[].occursOn", "overrides[].cancelled"]) assert.ok(html.includes("recurrence." + key), key)
  assert.match(html, /添加月更例外/)
  const museum = render(createElement(Programs, { lang: "ja" }))
  assert.ok(museum.includes(program.title.ja))
  assert.ok(museum.includes(program.link))
})

test("invalid monthly rules and exception dates are rejected before saving or generation", () => {
  for (const patch of [{ endMonth: undefined }, { endMonth: "2027-13" }, { endMonth: "2026-06" }, { overrides: [{ date: "2027-02-04", cancelled: true }] }, { weekOfMonth: 0 }, { weekOfMonth: 6 }, { weekday: "bad" }, { startOn: "2026-02-30" }, { updateTime: "25:00" }, { firstEpisode: 0 }, { overrides: [{ date: "2026-10-02" }] }, { overrides: [{ date: "2026-10-01", cancelled: true, occursOn: "2026-10-08" }] }, { overrides: [{ date: "2026-10-01", occursOn: "2026-11-05" }] }]) {
    const invalid = { ...program, recurrence: { ...program.recurrence, ...patch } }
    assert.ok(monthlyRuleIssues(invalid.recurrence).length)
    assert.ok(validateActivities([invalid]).some(issue => issue.severity === "error"))
    assert.deepEqual(getMonthlyPerformances(invalid), [])
  }
})

test("monthly rule and exception edits round-trip through the same YAML writer as other activities", async () => {
  const { updateActivityDocument } = await server.ssrLoadModule("/tools/content-editor/vitePlugin.ts")
  const edited = structuredClone(program)
  edited.recurrence.overrides = [{ date: "2026-11-05", occursOn: "2026-11-12", updateTime: "14:00" }]
  const source = "# Monthly schedule reference\n" + stringify([program])
  const saved = updateActivityDocument(source, [edited])
  assert.match(saved, /# Monthly schedule reference/)
  assert.deepEqual(parse(saved), [edited])
  assert.deepEqual(validateActivities(parse(saved)), [])
  assert.equal(getMonthlyPerformances(parse(saved)[0]).find(item => item.episode === "5").occursOn, "2026-11-12")
})

test("monthly validation rejects ambiguous supplement dates and nonexistent update times", () => {
  const duplicate = { ...program, performances: [{ occursOn: "2026-11-12" }], recurrence: { ...program.recurrence, overrides: [{ date: "2026-11-05", occursOn: "2026-11-12" }] } }
  assert.ok(validateActivities([duplicate]).some(issue => issue.message.includes("重合")))
  const dst = { ...program, timeZone: "America/New_York", performances: undefined, recurrence: { type: "monthly", startOn: "2026-01-01", endMonth: "2026-12", weekday: "sunday", weekOfMonth: 2, updateTime: "02:30" } }
  assert.ok(validateActivities([dst]).some(issue => issue.path.endsWith("recurrence.updateTime") && issue.message.includes("不存在")))
  dst.recurrence.updateTime = "03:30"
  assert.deepEqual(validateActivities([dst]), [])
})
