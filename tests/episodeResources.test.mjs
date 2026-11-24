import assert from "node:assert/strict"
import { after, test } from "node:test"
import { readFileSync } from "node:fs"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { createServer } from "vite"
import yaml from "@modyfi/vite-plugin-yaml"
import { parse } from "yaml"

const server = await createServer({ configFile: false, plugins: [yaml()], esbuild: { jsx: "automatic" }, ssr: { resolve: { conditions: ["module"] }, noExternal: ["react-router-dom", "react-router"] }, server: { middlewareMode: true, ws: false, watch: null }, optimizeDeps: { noDiscovery: true, include: [] }, appType: "custom" })
after(() => server.close())
const { default: activities } = await server.ssrLoadModule("/src/data/activities.ts")
const { activityResources } = await server.ssrLoadModule("/src/data/activityResources.ts")
const { filterActivityResources, groupEpisodeResources } = await server.ssrLoadModule("/src/utils/activityResources.ts")
const { getActivityOccurrences } = await server.ssrLoadModule("/src/utils/activitySchedule.ts")
const { getActivityDisplaySchedule } = await server.ssrLoadModule("/src/utils/activityDisplaySchedule.ts")
const { getProgramEpisodes } = await server.ssrLoadModule("/src/utils/programEpisodes.ts")
const { activityReference } = await server.ssrLoadModule("/src/editor/activityNavigation.ts")
const { validateResourceDocument } = await server.ssrLoadModule("/src/editor/resourceValidation.ts")
const { validateActivities } = await server.ssrLoadModule("/src/editor/activityValidation.ts")
const { buildCalendarData } = await server.ssrLoadModule("/src/hooks/useCalendarEvents.ts")
const { default: Disclosure } = await server.ssrLoadModule("/src/components/ActivityResourcesDisclosure.tsx")
const { default: ProgramEpisodes } = await server.ssrLoadModule("/src/components/ProgramEpisodes.tsx")
const { default: ActivityRow } = await server.ssrLoadModule("/src/components/ActivityRow.tsx")
const { default: ArchivedActivityEntry } = await server.ssrLoadModule("/src/components/ArchivedActivityEntry.tsx")
const { MemoryRouter } = await server.ssrLoadModule("react-router-dom")
const tv = activities.find(item => item.id === "bang-dream-tv-live")
const niji = activities.find(item => item.id === "nijigaku-monthly-live-stream")
const references = new Map(activities.map(item => [item.id, activityReference(item)]))
const ids = new Set(references.keys())
const render = element => renderToStaticMarkup(createElement(MemoryRouter, null, element))

test("all recurring programs show frequency and optional appearance notes, never episode date ranges", () => {
  const recurring = activities.filter(item => item.recurrence)
  assert.ok(recurring.length >= 6)
  for (const activity of recurring) {
    assert.equal(getActivityDisplaySchedule(activity), null, activity.id)
    const html = render(createElement(ActivityRow, { activity, lang: "ja" }))
    const summary = html.match(/<div class="text-sm text-coco-ink\/40 md:w-32">([\s\S]*?)<\/div>/)?.[1]
    assert.ok(summary?.includes(activity.scheduleLabel), activity.id)
    assert.doesNotMatch(summary, /\d{4}[.-]\d{2}[.-]\d{2}/)
    if (activity.program?.appearanceNote) {
      assert.ok(summary.includes(activity.program.appearanceNote.ja))
      assert.ok(render(createElement(ArchivedActivityEntry, { activity, lang: "en" })).includes(activity.program.appearanceNote.en))
    }
    const { scheduleLabel, ...missingFrequency } = activity
    assert.ok(validateActivities([missingFrequency]).some(issue => issue.path.endsWith(".scheduleLabel")))
  }
  assert.equal(getActivityDisplaySchedule({ ...tv, recurrence: undefined }), "2026.09.24 – 2026.11.19")
})

test("selected appearance programs use general IDs and manual episodes only", () => {
  for (const activity of [tv, niji]) {
    assert.equal(activity.recurrence.type, "manual")
    assert.equal(activity.program.display, "episodes")
    assert.equal(getActivityOccurrences(activity).length, activity.performances.length)
  }
  assert.deepEqual(tv.performances.map(item => item.episode), ["333", "341"])
  assert.equal(niji.title.ja, "虹ヶ咲生放送")
  assert.equal(niji.performances[0].startAt, "2026-11-24T20:30")
  assert.match(niji.performances[0].label.ja, /冬のはじまり/)
  assert.deepEqual(getProgramEpisodes(niji, Date.parse("2026-11-20T00:00:00+09:00")), [])
  assert.equal(getProgramEpisodes(niji, Date.parse("2026-11-24T20:30:00+09:00")).length, 1)
})

test("the Activities schedule includes confirmed future appearances while the Museum stays published-only", () => {
  const instant = Date.parse("2026-11-20T12:00:00+09:00")
  assert.equal(getProgramEpisodes(niji, instant, "all").length, 1)
  assert.equal(getProgramEpisodes(niji, instant).length, 0)
  const activity = render(createElement(ActivityRow, { activity: niji, lang: "ja" }))
  assert.match(activity, /aria-label="出演日程"/)
  assert.doesNotMatch(activity, /最近の出演回/)
  const confirmed = { ...niji, performances: [{ ...niji.performances[0], startAt: "2099-11-24T20:30" }] }
  const schedule = render(createElement(ProgramEpisodes, { activity: confirmed, lang: "ja", scope: "all", full: true }))
  assert.match(schedule, /2099年11月24日/)
  assert.match(schedule, /冬のはじまり/)
  assert.doesNotMatch(schedule, /出演回はまだ登録されていません/)
  const archive = render(createElement(ProgramEpisodes, { activity: confirmed, lang: "ja", full: true }))
  assert.doesNotMatch(archive, /2099年11月24日/)
  assert.match(archive, /出演回はまだ登録されていません/)
})

test("only the two opted-out programs hide their Activities schedule without changing archives or calendars", () => {
  const optedOut = activities.filter(item => item.program?.showSchedule === false)
  assert.deepEqual(optedOut.map(item => item.id).sort(), ["lovelive-discover-radio", "maison-de-coco"])
  for (const activity of optedOut) {
    const visible = { ...activity, program: { ...activity.program, showSchedule: true } }
    const row = render(createElement(ActivityRow, { activity, lang: "ja" }))
    assert.doesNotMatch(row, /aria-label="出演日程"/)
    assert.doesNotMatch(row, /aria-label="Appearance schedule"/)
    assert.match(render(createElement(ActivityRow, { activity: visible, lang: "ja" })), /aria-label="出演日程"/)
    assert.deepEqual(getProgramEpisodes(activity), getProgramEpisodes(visible))
    assert.deepEqual(buildCalendarData([activity]), buildCalendarData([visible]))
    assert.match(render(createElement(ProgramEpisodes, { activity, lang: "ja", compact: true })), /最近の出演回/)
  }
  for (const activity of [tv, niji]) {
    assert.match(render(createElement(ActivityRow, { activity, lang: "ja" })), /aria-label="出演日程"/)
  }
  assert.ok(validateActivities([{ ...niji, program: { ...niji.program, showSchedule: "false" } }]).some(issue => issue.path.endsWith(".showSchedule")))
})

test("the all-episodes scope preserves publication cutoffs and bounded recurrence generation", () => {
  const monthly = activities.find(item => item.id === "lovelive-discover-radio")
  const weekly = activities.find(item => item.id === "maison-de-coco")
  const instant = Date.parse("2026-07-01T00:00:00+09:00")
  for (const activity of [monthly, weekly]) {
    const before = JSON.stringify(activity)
    const all = getProgramEpisodes(activity, instant, "all")
    const published = getProgramEpisodes(activity, instant)
    assert.ok(all.length > published.length)
    assert.equal(all.length, getActivityOccurrences(activity).length)
    assert.ok(all.every(item => (item.startAt ?? item.occursOn).slice(0, 7) <= (activity.recurrence.endMonth ?? activity.recurrence.endOn.slice(0, 7))))
    assert.equal(JSON.stringify(activity), before)
  }
})

test("episode resources preserve authored links and group by episode, not post date", () => {
  const resources = filterActivityResources(activityResources, tv.id)
  assert.deepEqual(validateResourceDocument("activity-resources", activityResources, ids, references), [])
  const groups = groupEpisodeResources(resources, tv)
  assert.deepEqual(groups.map(item => item.performance.episode), ["341", "333"])
  assert.deepEqual(groups[0].resources.map(item => item.title.en).sort(), ["Coco's Posts", "Official Posts", "Other Cast Members' Posts"].sort())
  assert.deepEqual(groups.flatMap(group => group.resources).flatMap(item => item.links).map(item => item.url).sort(),
    resources.flatMap(item => item.links).map(item => item.url).sort())
  assert.ok(groups[0].resources.flatMap(item => item.links).some(item => item.date === "2026-11-12"))
  const urls = new Set(resources.flatMap(item => item.links).map(item => item.url))
  for (const url of [
    "https://x.com/cocohayashi515/status/2103072268490592512",
    "https://x.com/cocohayashi515/status/2103146960182288582",
    "https://x.com/bang_dream_info/status/2120878736254124400",
    "https://x.com/cocohayashi515/status/2123397990429950113",
    "https://x.com/bang_dream_info/status/2123402662628450631",
    "https://x.com/bang_dream_info/status/2123401092151332881",
    "https://x.com/kohinatamika/status/2123428900001005674",
  ]) assert.ok(urls.has(url), `Missing original link: ${url}`)
})

test("activity and episode archive show the same source categories without mixing episodes", () => {
  const html = render(createElement(Disclosure, { activityId: tv.id, lang: "en" }))
  assert.match(html, /2026-11-19 · Episode 341/)
  assert.match(html, /2026-09-24 · Episode 333/)
  assert.match(html, /Official Posts/)
  assert.match(html, /Other Cast Members&#x27; Posts/)
  assert.doesNotMatch(html, /<details[^>]*\bopen/)
  const one = render(createElement(Disclosure, { activityId: tv.id, performance: "2026-09-24T22:00", lang: "en" }))
  assert.match(one, /2103072268490592512/)
  assert.doesNotMatch(one, /2123397990429950113/)
  const archive = render(createElement(ProgramEpisodes, { activity: tv, lang: "en", full: true }))
  assert.match(archive, /Official Posts/)
  const expectedLinks = filterActivityResources(activityResources, tv.id).flatMap(item => item.links)
  assert.equal((archive.match(/href="https:\/\/x.com\//g) ?? []).length, expectedLinks.length)
  for (const link of expectedLinks) assert.ok(archive.includes(`href="${link.url}"`), link.url)
})

test("embedded schedules omit duplicate resources while the lower grouped disclosure and standalone archives retain them", () => {
  for (const activity of [tv, niji]) {
    const schedule = render(createElement(ProgramEpisodes, { activity, lang: "en", full: true, scope: "all", showResources: false }))
    assert.doesNotMatch(schedule, /Related resources|Official Posts|Coco&#x27;s Posts/)
    const grouped = render(createElement(Disclosure, { activityId: activity.id, lang: "en" }))
    for (const resource of filterActivityResources(activityResources, activity.id)) {
      for (const link of resource.links) assert.ok(grouped.includes(link.url))
    }
    const row = render(createElement(ActivityRow, { activity, lang: "en" }))
    assert.equal((row.match(/<summary[^>]*>Related resources/g) ?? []).length, 1)
  }
  const archive = render(createElement(ProgramEpisodes, { activity: tv, lang: "en", full: true }))
  assert.match(archive, /Official Posts/)
})

test("the same reference structure supports monthly appearances and rejects orphaned or cross-program resources", () => {
  const base = filterActivityResources(activityResources, tv.id)[0]
  const entry = { ...base, activityId: niji.id, performance: niji.performances[0].startAt }
  assert.deepEqual(validateResourceDocument("activity-resources", [entry], ids, references), [])
  assert.equal(groupEpisodeResources([entry], niji)[0].performance.label.ja, niji.performances[0].label.ja)
  for (const performance of ["2026-11-19T22:00", "341", "2026-11-24"]) {
    assert.ok(validateResourceDocument("activity-resources", [{ ...entry, performance }], ids, references).some(issue => issue.path.endsWith(".performance")))
  }
  assert.ok(references.get(tv.id).performances.some(item => item.title.includes("341")))
  assert.deepEqual(validateResourceDocument("activity-resources", [{ ...base, performance: undefined }], ids, references), [])
  const raw = parse(readFileSync("src/data/activities.yaml", "utf8"))
  assert.equal(raw.find(item => item.id === tv.id).performances.length, 2)
})
