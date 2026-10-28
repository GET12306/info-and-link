import assert from "node:assert/strict"
import { after, test } from "node:test"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { createServer } from "vite"
import yaml from "@modyfi/vite-plugin-yaml"

const server = await createServer({ configFile: false, plugins: [yaml()], esbuild: { jsx: "automatic" }, ssr: { resolve: { conditions: ["module"] }, noExternal: ["react-router-dom", "react-router"] }, server: { middlewareMode: true, ws: false, watch: null }, optimizeDeps: { noDiscovery: true, include: [] }, appType: "custom" })
after(() => server.close())
const { default: activities } = await server.ssrLoadModule("/src/data/activities.ts")
const { getProgramEpisodes, programArchivePath } = await server.ssrLoadModule("/src/utils/programEpisodes.ts")
const { getActivityOccurrences } = await server.ssrLoadModule("/src/utils/activitySchedule.ts")
const { buildCalendarData } = await server.ssrLoadModule("/src/hooks/useCalendarEvents.ts")
const { validateActivities } = await server.ssrLoadModule("/src/editor/activityValidation.ts")
const { PerformanceEditor } = await server.ssrLoadModule("/src/editor/ActivityScheduleEditor.tsx")
const { default: ProgramEpisodes } = await server.ssrLoadModule("/src/components/ProgramEpisodes.tsx")
const { default: Programs } = await server.ssrLoadModule("/src/pages/Programs.tsx")
const { MemoryRouter } = await server.ssrLoadModule("react-router-dom")
const program = activities.find(activity => activity.id === "tricolor")
const now = Date.parse("2026-10-26T11:00:00Z")
const render = element => renderToStaticMarkup(createElement(MemoryRouter, null, element))

test("Tricolor stores 40 published appearances in the common YAML, excluding confirmed absences", () => {
  assert.deepEqual(validateActivities(activities), [])
  assert.equal(program.recurrence.type, "manual")
  assert.equal(program.performancesFile, "activity-schedules/tricolor.yaml")
  assert.equal(program.program.display, "episodes")
  const episodes = getProgramEpisodes(program, now)
  assert.equal(episodes.length, 40)
  assert.deepEqual(episodes.map(item => item.episode), Array.from({ length: 42 }, (_, index) => String(41 - index)).filter(number => !["32", "33"].includes(number)))
  assert.equal(new Set(episodes.map(item => item.occursOn)).size, 40)
  assert.equal(episodes[0].occursOn, "2026-10-22")
  assert.equal(episodes.at(-1).occursOn, "2024-09-07")
  assert.equal(episodes.find(item => item.episode === "1").occursOn, "2024-10-10")
  assert.equal(episodes.find(item => item.episode === "7").occursOn, "2025-01-16")
  assert.equal(episodes.find(item => item.episode === "31").occursOn, "2026-01-15")
  for (const episode of ["18", "38"]) assert.ok(episodes.some(item => item.episode === episode))
  assert.ok(episodes.every(item => item.link === undefined && item.startAt === undefined))
})

test("manual future plans remain on the calendar but do not become published archives", () => {
  for (const date of ["2026-08-27", "2026-09-10", "2026-10-22", "2026-11-19"]) {
    assert.ok(program.performances.some(item => item.occursOn === date))
  }
  assert.equal(program.performances.find(item => item.occursOn === "2026-11-19").episode, undefined)
  const events = buildCalendarData([program], undefined, "Asia/Tokyo", now).flatMap(month => month.weeks.flat().flatMap(day => day.events))
  assert.equal(events.find(item => item.date === "2026-10-22").archivePath, programArchivePath(program.id, "2026-10-22"))
  assert.equal(events.find(item => item.date === "2026-11-19").archivePath, undefined)
  assert.ok(!getProgramEpisodes(program, now).some(item => item.occursOn === "2026-11-19"))
  assert.ok(getProgramEpisodes(program, Date.parse("2026-11-19T00:00:00+09:00")).some(item => item.occursOn === "2026-11-19"))
})

test("only explicitly confirmed clock times are recorded and the postponed episode uses its actual day", () => {
  const timed = program.performances.filter(item => item.milestones?.length)
  assert.deepEqual(timed.map(item => [item.episode, item.occursOn, item.milestones[0].at]), [
    ["28", "2025-11-27", "13:00"], ["27", "2025-11-20", "13:00"],
  ])
  assert.ok(!program.performances.some(item => item.occursOn === "2025-11-06"))
  assert.ok(getActivityOccurrences(program).every(item => item.allDay))
  assert.equal(getProgramEpisodes(program, Date.parse("2025-11-20T12:59:00+09:00"))[0].episode, "26")
  assert.equal(getProgramEpisodes(program, Date.parse("2025-11-20T13:00:00+09:00"))[0].episode, "27")
})

test("Tricolor uses the shared editor, overall program link and five-record archive without extra copy", () => {
  const editor = render(createElement(PerformanceEditor, { performances: program.performances, recurrenceType: "manual", episodeMode: true, sourceFile: program.performancesFile, onChange() {} }))
  assert.match(editor, /tricolor.yaml/)
  assert.match(editor, /添加回数/)
  assert.match(editor, /performances\[\].episode/)
  assert.equal((editor.match(/class="item-card"/g) ?? []).length, 5)
  const museum = render(createElement(Programs, { lang: "ja" }))
  assert.match(museum, /href="https:\/\/www.onsen.ag\/program\/tricolor"/)
  const list = render(createElement(ProgramEpisodes, { activity: program, lang: "ja", full: true }))
  assert.equal((list.match(/<li\b/g) ?? []).length, 5)
  assert.match(list, /第41回/)
  assert.doesNotMatch(list, /個別リンク未登録|回数未登録|2026年11月19日/)
  const oldest = render(createElement(ProgramEpisodes, { activity: program, lang: "ja", full: true, selectedPublishedAt: "2024-09-07" }))
  assert.match(oldest, /第0回/)
})
