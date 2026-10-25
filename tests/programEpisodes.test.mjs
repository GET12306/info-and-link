import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { after, test } from "node:test"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { parse } from "yaml"
import { createServer } from "vite"
import yaml from "@modyfi/vite-plugin-yaml"

const server = await createServer({
  configFile: false, plugins: [yaml()], esbuild: { jsx: "automatic" },
  ssr: { resolve: { conditions: ["module"] }, noExternal: ["react-router-dom", "react-router"] },
  server: { middlewareMode: true, ws: false, watch: null },
  optimizeDeps: { noDiscovery: true, include: [] }, appType: "custom",
})
after(() => server.close())
const { MemoryRouter } = await server.ssrLoadModule("react-router-dom")
const { default: activities } = await server.ssrLoadModule("/src/data/activities.ts")
const { getProgramEpisodes, programArchivePath, programEpisodeDate, programEpisodeLink } = await server.ssrLoadModule("/src/utils/programEpisodes.ts")
const { getActivityOccurrences } = await server.ssrLoadModule("/src/utils/activitySchedule.ts")
const { getCurrentActivities } = await server.ssrLoadModule("/src/utils/activityStatus.ts")
const { buildCalendarData } = await server.ssrLoadModule("/src/hooks/useCalendarEvents.ts")
const { buildMuseumSearchItems, filterMuseumItems } = await server.ssrLoadModule("/src/utils/museumSearch.ts")
const { default: ProgramEpisodes } = await server.ssrLoadModule("/src/components/ProgramEpisodes.tsx")
const { default: ActivityRow } = await server.ssrLoadModule("/src/components/ActivityRow.tsx")
const { attachActivitySchedules } = await server.ssrLoadModule("/src/utils/activityScheduleFiles.ts")
const { validateActivities } = await server.ssrLoadModule("/src/editor/activityValidation.ts")
const { PerformanceEditor } = await server.ssrLoadModule("/src/editor/ActivityScheduleEditor.tsx")
const { default: CalendarMonth } = await server.ssrLoadModule("/src/components/CalendarMonth.tsx")
const maigo = activities.find(activity => activity.id === "mygo-random-radio-lost-center")
const render = element => renderToStaticMarkup(createElement(MemoryRouter, null, element))

test("the episode archive covers every confirmed appearance in the official #1–#200 audit and preserves original dates", () => {
  const archive = parse(readFileSync("src/data/activity-schedules/maigo-center.yaml", "utf8"))
  const audit = JSON.parse(readFileSync("docs/data-audits/maigo-center.json", "utf8"))
  assert.deepEqual(validateActivities(activities), [])
  assert.deepEqual(maigo.performances, archive.performances)
  assert.equal(maigo.programEpisodes, undefined)
  assert.deepEqual(audit.episodes.map(episode => Number(episode.episode)).sort((a,b) => a-b), Array.from({ length: 200 }, (_, index) => index + 1))
  const confirmed = audit.episodes.filter(episode => episode.included)
  assert.equal(confirmed.length, 86)
  assert.equal(audit.unavailableVideos.length, 7)
  for (const checked of audit.episodes) {
    assert.equal(checked.included, /林\s*鼓子|立希/.test(checked.personalities))
    const matching = maigo.performances.find(episode => episode.link === checked.url)
    assert.equal(Boolean(matching), checked.included, `Episode ${checked.episode}`)
    assert.equal(checked.publishedAt, new Date(Date.parse(checked.sourcePublishedAt) + 9 * 3_600_000).toISOString().slice(0,16))
    if (matching) assert.deepEqual(matching, { episode: checked.episode, link: checked.url, startAt: checked.publishedAt })
  }
  for (const [episode, startAt] of [
    ["188", "2026-07-22T19:00"], ["189", "2026-07-29T19:00"],
    ["198", "2026-09-30T19:00"], ["199", "2026-10-07T19:00"],
  ]) assert.equal(maigo.performances.find(record => record.episode === episode).startAt, startAt)
  assert.equal(maigo.performances.find(episode => episode.episode === "23").startAt, "2023-05-24T18:00")
  assert.equal(maigo.performances.find(episode => episode.episode === "56").startAt, "2024-01-10T19:10")
  assert.equal(getActivityOccurrences(maigo).length, maigo.performances.length)
  assert.equal(getCurrentActivities([maigo], "2030-01-01T12:00").length, 1)
})

test("date-only and timed publications keep their precision and use the parent source time zone", () => {
  const source = { ...maigo, timeZone: "Asia/Tokyo", performances: [
    { startAt: "2026-10-07T00:30", episode: "SP" },
    { occursOn: "2026-10-08" },
  ] }
  assert.equal(programEpisodeDate(source.performances[0], source, "America/Los_Angeles"), "2026-10-06T08:30")
  assert.equal(programEpisodeDate(source.performances[1], source, "America/Los_Angeles"), "2026-10-08")
  const dates = buildCalendarData([source], undefined, "America/Los_Angeles")[0].weeks.flat()
  assert.equal(dates.find(day => day.date === "2026-10-06").events[0].episode, "SP")
  assert.ok(dates.find(day => day.date === "2026-10-08").events[0].archivePath.includes("episode=2026-10-08"))
})

test("published calendar entries stay actionable after publication and link to the exact archive record", () => {
  const month = buildCalendarData([maigo], "2026-10-20", "Asia/Tokyo")[0]
  const event = month.weeks.flat().find(day => day.date === "2026-10-07").events[0]
  assert.equal(event.archivePath, programArchivePath(maigo.id, "2026-10-07T19:00"))
  const html = render(createElement(CalendarMonth, {
    month, lang: "en", now: "2026-10-20T12:00", activities: [maigo], onSelectEvent() {},
    hasPrev: false, hasNext: false, onPrev() {}, onNext() {}, monthKeys: [month.key], onSelectMonth() {},
  }))
  const episodeButtons = html.match(/<button[^>]+aria-label="[^"]*View episode record[^"]*"[^>]*>/g)
  assert.equal(episodeButtons.length, month.weeks.flat().flatMap(day => day.events).length * 2, "mobile and desktop render each recording as actionable")
  assert.ok(episodeButtons.every(button => !button.includes("disabled")))
  assert.ok(episodeButtons.every(button => button.includes("border-coco-ink/20")))
  assert.ok(episodeButtons.every(button => !button.includes("coco-accent")))
})

test("published recordings are neutral immediately, without waiting for their default duration or day to end", () => {
  for (const [performance, now] of [
    [{ startAt: "2026-10-07T19:00", episode: "123" }, "2026-10-07T19:00"],
    [{ startAt: "2026-10-07T19:00", episode: "123" }, "2026-10-07T19:05"],
    [{ startAt: "2026-10-07T19:00", episode: "123" }, "2026-10-07T20:31"],
    [{ occursOn: "2026-10-07", episode: "123" }, "2026-10-07T00:01"],
    [{ occursOn: "2026-10-07", episode: "123" }, undefined],
  ]) {
    const activity = { ...maigo, performances: [performance] }
    const month = buildCalendarData([activity], undefined, "Asia/Tokyo")[0]
    const html = render(createElement(CalendarMonth, {
      month, lang: "en", now, activities: [activity], onSelectEvent() {},
      hasPrev: false, hasNext: false, onPrev() {}, onNext() {}, monthKeys: [month.key], onSelectMonth() {},
    }))
    const cards = html.match(/<button[^>]+aria-label="[^"]*View episode record[^"]*"[^>]*>[\s\S]*?<\/button>/g) ?? []
    assert.equal(cards.length, 2, "both mobile and desktop layouts retain archive actions")
    for (const card of cards) {
      assert.match(card, /border-coco-ink\/20/)
      assert.doesNotMatch(card, /disabled|coco-accent|cursor-default/)
    }
  }
})

test("ordinary performances retain red upcoming/current cards and disabled gray past cards", () => {
  const activity = { ...maigo, program: undefined, performancesFile: undefined, recurrence: undefined, performances: [{ startAt: "2026-10-07T19:00" }] }
  const month = buildCalendarData([activity], undefined, "Asia/Tokyo")[0]
  for (const [now, past] of [["2026-10-07T18:00", false], ["2026-10-07T19:05", false], ["2026-10-07T20:31", true]]) {
    const html = render(createElement(CalendarMonth, {
      month, lang: "en", now, activities: [activity], onSelectEvent() {},
      hasPrev: false, hasNext: false, onPrev() {}, onNext() {}, monthKeys: [month.key], onSelectMonth() {},
    }))
    const cards = html.match(/<button[^>]+aria-label="[^"]*Maigo Center[^"]*"[^>]*>/g) ?? []
    assert.equal(cards.length, 2)
    for (const card of cards) {
      assert.equal(card.includes("disabled"), past)
      assert.equal(card.includes("border-coco-accent"), !past)
      assert.equal(card.includes("border-coco-ink/20"), past)
    }
  }
})

test("episode previews start with only the shared disclosure button and defer all records", () => {
  // Keep this rendering fixture bounded to the audited snapshot as new episodes are added.
  const snapshot = { ...maigo, performances: maigo.performances.filter(episode => Number(episode.episode) <= 200) }
  const html = render(createElement(ProgramEpisodes, { activity: snapshot, lang: "en" }))
  assert.match(html, /<button[^>]*aria-expanded="false"[^>]*aria-controls="[^"]+"[^>]*aria-label="Recent appearances"/)
  assert.match(html, /rounded-full border grid-line/)
  assert.match(html, /hidden=""/)
  for (const text of ["Episode 200", "Wednesdays at 19:00", "View all appearances", "Listen to this episode", "Most recently recorded appearance"]) {
    assert.ok(!html.includes(text), text)
  }

  const compact = render(createElement(ProgramEpisodes, { activity: snapshot, lang: "en", compact: true }))
  assert.match(compact, /<details class="catalog-disclosure">/)
  assert.match(compact, /Recent appearances/)
  assert.doesNotMatch(compact, /Episode 200|View all appearances|<details[^>]*\bopen/)
})

test("program notes live in the ordinary description field", () => {
  const description = "Program overview and usual update schedule."
  const activity = { ...maigo, description: { ja: "番組紹介と更新予定", en: description } }
  const html = render(createElement(ActivityRow, { activity, lang: "en" }))
  assert.equal(html.split(description).length - 1, 1)
  assert.doesNotMatch(html, /JST|日本時間|日本时间/)
  assert.deepEqual(Object.keys(maigo.program), ["display"])
})

test("episode dates omit timezone labels while still converting to the viewer's timezone", () => {
  const original = process.env.TZ
  try {
    process.env.TZ = "America/Los_Angeles"
    const activity = { ...maigo, performances: [{ startAt: "2026-10-07T00:30", episode: "SP" }] }
    for (const lang of ["ja", "en"]) {
      const html = render(createElement(ProgramEpisodes, { activity, lang, full: true }))
      assert.match(html, /dateTime="2026-10-06T15:30:00\.000Z"/)
      assert.match(html, /08:30/)
      assert.doesNotMatch(html, /JST|日本時間|日本时间|UTC|GMT/)
    }
  } finally {
    if (original === undefined) delete process.env.TZ
    else process.env.TZ = original
  }
  assert.ok(activities.every(activity => !/JST|日本時間|日本时间/.test(JSON.stringify(activity.description))))
})

test("the Museum program title links to the official playlist, not the dedicated archive", async () => {
  const { default: Programs } = await server.ssrLoadModule("/src/pages/Programs.tsx")
  for (const lang of ["ja", "en"]) {
    const html = render(createElement(Programs, { lang }))
    const titleLink = html.match(/<h2[^>]*><a[^>]*href="https:\/\/www.youtube.com\/playlist\?list=PLUFFl4hYd1R0SQPSCAqPVuT5F2By4pqO7"[^>]*>/)
    assert.ok(titleLink)
    assert.match(titleLink[0], /target="_blank"/)
    assert.ok(!html.includes('href="' + programArchivePath(maigo.id) + '"'))
    assert.doesNotMatch(html, /JST|日本時間|日本时间/)
  }
})

test("full episode lists preserve optional metadata and deep links beyond the first page", () => {
  const withoutDetails = render(createElement(ProgramEpisodes, { activity: { ...maigo, performances: [{ occursOn: "2026-10-07" }] }, lang: "en", full: true }))
  assert.match(withoutDetails, /Episode number not recorded/)
  assert.doesNotMatch(withoutDetails, /Listen to this episode/)

  const performances = Array.from({ length: 25 }, (_, index) => ({ occursOn: `2026-09-${String(index + 1).padStart(2, "0")}` }))
  const full = render(createElement(ProgramEpisodes, {
    activity: { ...maigo, performances }, lang: "en", full: true, selectedPublishedAt: "2026-09-01",
  }))
  assert.match(full, /id="program-episode-2026-09-01"/)
})

test("the usual update schedule is display-only and cannot generate additional appearances", () => {
  const changed = { ...maigo, description: { ja: "毎日 12:00", en: "Daily at 12:00" } }
  assert.deepEqual(getActivityOccurrences(changed), getActivityOccurrences(maigo))
  const empty = { ...changed, performances: [] }
  assert.deepEqual(getActivityOccurrences(empty), [])
  assert.equal(getCurrentActivities([empty], "2030-01-01T12:00").length, 1)
})

test("listening availability follows the link status, independent of publication age", () => {
  const episode = { occursOn: "2023-01-01", episode: "123", link: "https://example.com/123" }
  assert.equal(programEpisodeLink(episode), episode.link)
  assert.equal(programEpisodeLink({ ...episode, status: "expired" }), undefined)
  assert.equal(programEpisodeLink({ ...episode, link: "javascript:alert(1)" }), undefined)
  const html = render(createElement(ProgramEpisodes, { activity: { ...maigo, performances: [episode] }, lang: "en", full: true }))
  assert.match(html, /Episode 123/)
  assert.match(html, /href="https:\/\/example.com\/123"/)
  assert.match(html, /<a[^>]*href="https:\/\/example.com\/123"[^>]*>Episode 123<\/a>/)
  assert.doesNotMatch(html, /Listen to this episode/)
  const expired = render(createElement(ProgramEpisodes, { activity: { ...maigo, performances: [{ ...episode, status: "expired" }] }, lang: "en", full: true }))
  assert.doesNotMatch(expired, /href="https:\/\/example.com\/123"/)
  assert.match(expired, /Episode 123/)
})

test("Museum search includes episode numbers and publication dates under Programs", () => {
  const episode = { occursOn: "2026-10-07", episode: "123", link: "https://example.com/123" }
  const sources = { credits: [], activities: [], programs: [], photobooks: [], magazines: [], notes: [], dailyPosts: [], accounts: [],
    episodePrograms: [{ ...maigo, performances: [episode] }] }
  const results = filterMuseumItems(buildMuseumSearchItems(sources, "en"), "123", "programs", "2026-10-07")
  assert.equal(results.length, 1)
  assert.equal(results[0].href, episode.link)
  assert.equal(results[0].path, programArchivePath(maigo.id, episode.occursOn))
})

test("the same editor manages five performances with time, episode and link fields", () => {
  const html = render(createElement(PerformanceEditor, {
    performances: maigo.performances, episodeMode: true, sourceFile: maigo.performancesFile,
    recurrenceType: "manual", onChange() {},
  }))
  assert.equal((html.match(/class="item-card"/g) ?? []).length, 5)
  assert.match(html, /添加回数/)
  for (const field of ["startAt", "episode", "link", "status", "description"]) {
    assert.ok(html.includes("performances[]." + field), field)
  }
  assert.match(html, /occursOn — YYYY-MM-DD/)
  assert.match(html, /maigo-center.yaml/)
  assert.ok(html.includes("共 " + maigo.performances.length + " 条，每页 5 条"))
})

test("the page shows exactly five records and retains deep links to older pages", () => {
  const html = render(createElement(ProgramEpisodes, { activity: maigo, lang: "en", full: true }))
  assert.equal((html.match(/<li /g) ?? []).length, 5)
  assert.match(html, /Previous 5/)
  assert.match(html, /Next 5/)
  assert.ok(html.includes("1 / " + Math.ceil(maigo.performances.length / 5)))
  const performances = Array.from({ length: 25 }, (_, index) => ({ occursOn: "2026-09-" + String(index + 1).padStart(2, "0") }))
  const selected = render(createElement(ProgramEpisodes, { activity: { ...maigo, performances }, lang: "en", full: true, selectedPublishedAt: "2026-09-01" }))
  assert.equal((selected.match(/<li /g) ?? []).length, 5)
  assert.match(selected, /5 \/ 5/)
  assert.match(selected, /id="program-episode-2026-09-01"/)
})

test("shared validation checks episode metadata, duplicate dates and safe child references", () => {
  const invalid = { ...maigo, performances: [
    { occursOn: "2026-02-30" },
    { occursOn: "2026-10-07", episode: 123, link: "javascript:bad", status: "unknown" },
    { occursOn: "2026-10-07", description: { ja: "説明" } },
  ] }
  const issues = validateActivities([invalid])
  for (const field of ["occursOn", "episode", "link", "status", "description.en"]) {
    assert.ok(issues.some(issue => issue.path.includes(field)), field)
  }
  assert.ok(issues.some(issue => issue.message.includes("重复场次")))
  assert.ok(validateActivities([{ ...maigo, performancesFile: "../private.yaml" }]).some(issue => issue.path.endsWith(".performancesFile")))
  const raw = { ...maigo, performances: undefined }
  const joined = attachActivitySchedules([raw], { [maigo.performancesFile]: { performances: [{ occursOn: "2026-10-07" }] } })
  assert.equal(raw.performances, undefined)
  assert.equal(joined[0].performances.length, 1)
  assert.throws(() => attachActivitySchedules([raw], {}), /performances/)
  assert.throws(() => attachActivitySchedules([maigo], {}), /not both/)
  assert.equal(getProgramEpisodes(maigo).length, maigo.performances.length)
})
