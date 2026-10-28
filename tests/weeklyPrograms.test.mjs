import assert from "node:assert/strict"
import { after, test } from "node:test"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { createServer } from "vite"
import yaml from "@modyfi/vite-plugin-yaml"

const server = await createServer({ configFile: false, plugins: [yaml()], esbuild: { jsx: "automatic" }, ssr: { resolve: { conditions: ["module"] }, noExternal: ["react-router-dom", "react-router"] }, server: { middlewareMode: true, ws: false, watch: null }, optimizeDeps: { noDiscovery: true, include: [] }, appType: "custom" })
after(() => server.close())
const { default: activities } = await server.ssrLoadModule("/src/data/activities.ts")
const { getWeeklyPerformances, getActivityOccurrences } = await server.ssrLoadModule("/src/utils/activitySchedule.ts")
const { getProgramEpisodes } = await server.ssrLoadModule("/src/utils/programEpisodes.ts")
const { buildCalendarData } = await server.ssrLoadModule("/src/hooks/useCalendarEvents.ts")
const { validateActivities } = await server.ssrLoadModule("/src/editor/activityValidation.ts")
const { getCalendarOccurrences } = await server.ssrLoadModule("/src/utils/activityCalendar.ts")
const { RecurrenceEditor, PerformanceEditor } = await server.ssrLoadModule("/src/editor/ActivityScheduleEditor.tsx")
const { default: ProgramEpisodes } = await server.ssrLoadModule("/src/components/ProgramEpisodes.tsx")
const { default: Programs } = await server.ssrLoadModule("/src/pages/Programs.tsx")
const { MemoryRouter } = await server.ssrLoadModule("react-router-dom")
const program = activities.find(activity => activity.id === "maison-de-coco")
const now = Date.parse("2026-10-26T11:00:00Z")
const render = element => renderToStaticMarkup(createElement(MemoryRouter, null, element))

test("Maison de Coco preserves official episode 0, weekly numbering through 42, and one birthday slot", () => {
  assert.deepEqual(validateActivities(activities), [])
  assert.equal(program.performancesFile, "activity-schedules/maison-de-coco.yaml")
  assert.equal(program.performances.length, 2)
  const episodes = getProgramEpisodes(program, now)
  assert.equal(episodes.length, 43)
  assert.deepEqual(episodes.map(item => item.episode), Array.from({ length: 43 }, (_, index) => String(42 - index)))
  assert.equal(episodes[0].startAt, "2026-10-23T22:00")
  assert.equal(episodes.at(-1).occursOn, "2026-01-02")
  assert.equal(episodes.at(-1).startAt, undefined)
  const birthday = episodes.filter(item => item.startAt?.startsWith("2026-05-15"))
  assert.equal(birthday.length, 1)
  assert.equal(birthday[0].startAt, "2026-05-15T20:00")
  assert.equal(birthday[0].label.ja, "バースデー生配信")
  assert.equal(episodes.find(item => item.episode === "20").startAt, "2026-05-22T22:00")
  assert.ok(getWeeklyPerformances(program).some(item => item.startAt === "2026-10-30T22:00" && item.episode === "43"))
  assert.ok(episodes.every(item => item.link === undefined))
})

test("weekly archives wait until publication and calendar cards become archived immediately at 22:00", () => {
  for (const published of [false, true]) {
    const instant = Date.parse(published ? "2026-10-23T13:00:00Z" : "2026-10-23T12:59:00Z")
    assert.equal(getProgramEpisodes(program, instant)[0].episode, published ? "42" : "41")
    const event = buildCalendarData([program], undefined, "Asia/Tokyo", instant).flatMap(month => month.weeks.flat().flatMap(day => day.events)).find(item => item.date === "2026-10-23")
    assert.equal(Boolean(event.archivePath), published)
    assert.equal(event.episode, "42")
  }
  assert.equal(getProgramEpisodes(program, Date.parse("2026-05-15T10:59:00Z"))[0].episode, "18")
  assert.equal(getProgramEpisodes(program, Date.parse("2026-05-15T11:00:00Z"))[0].label.ja, "バースデー生配信")
})

test("weekly metadata and cancellation merge without mutating source or renumbering later episodes", () => {
  const copy = structuredClone(program)
  copy.recurrence.overrides = [{ date: "2026-10-30", cancelled: true }]
  const before = JSON.stringify(copy)
  const performances = getWeeklyPerformances(copy)
  assert.ok(!performances.some(item => item.startAt?.startsWith("2026-10-30")))
  assert.equal(performances.find(item => item.startAt === "2026-11-06T22:00").episode, "44")
  assert.equal(JSON.stringify(copy), before)
  const occurrences = getActivityOccurrences(copy)
  assert.equal(new Set(occurrences.map(item => item.startAt ?? item.date)).size, occurrences.length)
})

test("weekly episode editor and Museum reuse the ordinary controls without individual replay links", () => {
  const rule = render(createElement(RecurrenceEditor, { recurrence: program.recurrence, onChange() {} }))
  assert.match(rule, /recurrence.firstEpisode/)
  const editor = render(createElement(PerformanceEditor, { performances: program.performances, recurrenceType: "weekly", episodeMode: true, sourceFile: program.performancesFile, onChange() {} }))
  assert.match(editor, /performances\[\].label/)
  assert.match(editor, /バースデー生配信/)
  const museum = render(createElement(Programs, { lang: "ja" }))
  assert.match(museum, /href="https:\/\/audee-membership.jp\/coco-hayashi"/)
  const list = render(createElement(ProgramEpisodes, { activity: program, lang: "ja", full: true }))
  assert.equal((list.match(/<li\b/g) ?? []).length, 5)
  assert.doesNotMatch(list, /個別リンク未登録|\/audio\/|\/video\//)
})

test("weekly validation rejects conflicting rule supplements and preserves strict calendar export", () => {
  for (const mutate of [
    item => { item.recurrence.firstEpisode = -1 },
    item => { delete item.performances[1].startAt; item.performances[1].occursOn = "2026-05-15" },
    item => { item.performances.push({ startAt: "2026-05-15T20:01" }) },
    item => { item.recurrence.overrides = [{ date: "2026-05-15", cancelled: true }] },
  ]) {
    const copy = structuredClone(program)
    mutate(copy)
    assert.ok(validateActivities([copy]).length)
    assert.deepEqual(getCalendarOccurrences({ ...copy, calendarExport: "enabled" }), [])
  }
  const exported = getCalendarOccurrences({ ...program, calendarExport: "enabled" })
  assert.equal(exported.length, getActivityOccurrences(program).length)
  assert.equal(exported.filter(item => item.date === "2026-05-15").length, 1)
})
