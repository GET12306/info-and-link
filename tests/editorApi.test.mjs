import assert from "node:assert/strict"
import { after, test } from "node:test"
import { createHash } from "node:crypto"
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { Readable } from "node:stream"
import { createServer } from "vite"
import { parse } from "yaml"

const server = await createServer({ configFile: false, server: { middlewareMode: true, ws: false, watch: null }, optimizeDeps: { noDiscovery: true, include: [] }, appType: "custom" })
after(() => server.close())
const { activityEditorPlugin } = await server.ssrLoadModule("/tools/content-editor/vitePlugin.ts")
const base = { id: "event", category: "Live", scheduleLabel: "2026.10.10", title: { ja: "例", en: "Example" }, link: "https://example.com", performances: [{ startAt: "2026-10-10T18:00" }] }

test("concurrent saves serialize revision checks and acknowledge the actual disk content", async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), "content-editor-test-"))
  t.after(() => rm(root, { recursive: true, force: true }))
  const directory = path.join(root, "src/data")
  await mkdir(directory, { recursive: true })
  const file = path.join(directory, "activities.yaml")
  const source = JSON.stringify([base])
  await writeFile(file, source)
  await writeFile(path.join(directory, "venues.yaml"), "venues: []\n")
  let handler
  activityEditorPlugin(true).configureServer({ config: { root }, middlewares: { use(fn) { handler = fn } } })
  const save = (title, revision, extra = {}) => new Promise((resolve, reject) => {
    const request = Readable.from([Buffer.from(JSON.stringify({ activities: [{ ...base, title: { ja: title, en: title }, ...extra }], revision }))])
    Object.assign(request, { url: "/__activity-editor/activities", method: "PUT", socket: { remoteAddress: "127.0.0.1" } })
    const response = { statusCode: 200, setHeader() {}, end(body) { resolve({ title, status: response.statusCode, body: JSON.parse(body) }) } }
    Promise.resolve(handler(request, response, () => reject(new Error("API not handled")))).catch(reject)
  })
  const revision = createHash("sha256").update(source).digest("hex")
  const results = await Promise.all([save("First", revision), save("Second", revision)])
  assert.deepEqual(results.map(result => result.status).sort(), [200, 409])
  const successful = results.find(result => result.status === 200)
  const disk = await readFile(file, "utf8")
  assert.equal(parse(disk)[0].title.en, successful.title)
  assert.equal(createHash("sha256").update(disk).digest("hex"), successful.body.revision)

  const unregisteredVenue = await save("Unregistered venue", successful.body.revision, { venueIds: ["missing-venue"] })
  assert.equal(unregisteredVenue.status, 200)
  assert.deepEqual(parse(await readFile(file, "utf8"))[0].venueIds, ["missing-venue"])
  assert.equal((await save("Next", unregisteredVenue.body.revision)).status, 200)
  assert.equal(parse(await readFile(file, "utf8"))[0].title.en, "Next")
  assert.deepEqual((await readdir(directory)).filter(name => name.endsWith(".tmp")), [])
})

test("activity resource reads include activity titles for editor lookup", async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), "content-editor-references-test-"))
  t.after(() => rm(root, { recursive: true, force: true }))
  const directory = path.join(root, "src/data")
  await mkdir(directory, { recursive: true })
  await writeFile(path.join(directory, "activities.yaml"), JSON.stringify([base]))
  await writeFile(path.join(directory, "activity-resources.yaml"), JSON.stringify([{
    activityId: base.id,
    kind: "photo",
    platform: "x",
    title: { ja: "写真", en: "Photos" },
    links: [{ url: "https://example.com/photo", date: "2026-10-10" }],
  }]))
  let handler
  activityEditorPlugin(true).configureServer({ config: { root }, middlewares: { use(fn) { handler = fn } } })
  const result = await new Promise((resolve, reject) => {
    const request = Readable.from([])
    Object.assign(request, { url: "/__activity-editor/data/activity-resources", method: "GET", socket: { remoteAddress: "127.0.0.1" } })
    const response = { statusCode: 200, setHeader() {}, end(body) { resolve({ status: response.statusCode, body: JSON.parse(body) }) } }
    Promise.resolve(handler(request, response, () => reject(new Error("API not handled")))).catch(reject)
  })
  assert.equal(result.status, 200)
  const [reference] = result.body.activityReferences
  assert.equal(reference.id, base.id)
  assert.deepEqual(reference.title, base.title)
  assert.equal(reference.category, "Live")
  assert.equal(reference.scheduleLabel, base.scheduleLabel)
  assert.equal(reference.startAt, "2026-10-10T18:00")
  assert.equal(reference.startInstant, Date.parse("2026-10-10T18:00:00+09:00"))
})

async function childScheduleFixture(t) {
  const root = await mkdtemp(path.join(tmpdir(), "activity-child-test-"))
  t.after(() => rm(root, { recursive: true, force: true }))
  const directory = path.join(root, "src/data")
  await mkdir(path.join(directory, "activity-schedules"), { recursive: true })
  const parent = { ...base, category: "Program", recurrence: { type: "manual" }, program: { display: "episodes" }, performances: undefined, performancesFile: "activity-schedules/example-program.yaml" }
  const parentPath = path.join(directory, "activities.yaml")
  const childPath = path.join(directory, parent.performancesFile)
  await writeFile(parentPath, "# Parent reference\n" + JSON.stringify([parent]))
  await writeFile(childPath, '# Child reference\nperformances:\n  - startAt: "2026-10-10T18:00" # preserve original time comment\n    episode: "123"\n    link: "https://example.com/123"\n')
  await writeFile(path.join(directory, "venues.yaml"), "venues: []\n")
  let handler
  activityEditorPlugin(true).configureServer({ config: { root }, middlewares: { use(fn) { handler = fn } } })
  const request = (method, payload, url = "/__activity-editor/activities") => new Promise((resolve, reject) => {
    const req = Readable.from(payload ? [Buffer.from(JSON.stringify(payload))] : [])
    Object.assign(req, { url, method, socket: { remoteAddress: "127.0.0.1" } })
    const response = { statusCode: 200, setHeader() {}, end(body) { resolve({ status: response.statusCode, body: JSON.parse(body) }) } }
    Promise.resolve(handler(req, response, () => reject(new Error("API not handled")))).catch(reject)
  })
  return { root, directory, parentPath, childPath, request }
}

test("resource navigation includes the first date from a separate activity schedule file", async t => {
  const { directory, request } = await childScheduleFixture(t)
  await writeFile(path.join(directory, "activity-resources.yaml"), "[]\n")
  const result = await request("GET", undefined, "/__activity-editor/data/activity-resources")
  assert.equal(result.status, 200)
  assert.equal(result.body.activityReferences[0].startAt, "2026-10-10T18:00")
  assert.equal(result.body.activityReferences[0].category, "Program")
})

test("the activity API reads and saves common performances in their child YAML without duplicating them", async t => {
  const { parentPath, childPath, request } = await childScheduleFixture(t)
  const initialParent = await readFile(parentPath, "utf8")
  const initial = await request("GET")
  assert.equal(initial.status, 200)
  assert.equal(initial.body.activities[0].performances[0].episode, "123")
  const activities = initial.body.activities
  activities[0].performances.unshift({ startAt: "2026-10-17T19:01", episode: "124", link: "https://example.com/124" })
  const saved = await request("PUT", { activities, revision: initial.body.revision })
  assert.equal(saved.status, 200)
  assert.equal(await readFile(parentPath, "utf8"), initialParent, "editing an episode must not rewrite the parent")
  const child = await readFile(childPath, "utf8")
  assert.match(child, /# Child reference/)
  assert.match(child, /# preserve original time comment/)
  assert.deepEqual(parse(child).performances, activities[0].performances)
  assert.equal(parse(await readFile(parentPath, "utf8"))[0].performances, undefined)
  const reread = await request("GET")
  assert.equal(reread.body.revision, saved.body.revision)
  assert.deepEqual(reread.body.activities, activities)
})

test("external child changes invalidate the editor revision and invalid child rows cannot write either file", async t => {
  const { parentPath, childPath, request } = await childScheduleFixture(t)
  const initial = await request("GET")
  await writeFile(childPath, (await readFile(childPath, "utf8")) + "# External edit\n")
  const external = await readFile(childPath, "utf8")
  const parent = await readFile(parentPath, "utf8")
  assert.equal((await request("PUT", { activities: initial.body.activities, revision: initial.body.revision })).status, 409)
  assert.equal(await readFile(childPath, "utf8"), external)
  const current = await request("GET")
  assert.notEqual(current.body.revision, initial.body.revision)
  const activities = current.body.activities
  activities[0].performances[0].link = "javascript:alert(1)"
  assert.equal((await request("PUT", { activities, revision: current.body.revision })).status, 422)
  assert.equal(await readFile(parentPath, "utf8"), parent)
  assert.equal(await readFile(childPath, "utf8"), external)
})

test("bundle saves serialize concurrent child edits and never lose the winning record", async t => {
  const { childPath, request } = await childScheduleFixture(t)
  const initial = await request("GET")
  const save = episode => {
    const activities = structuredClone(initial.body.activities)
    activities[0].performances[0].episode = episode
    return request("PUT", { activities, revision: initial.body.revision })
  }
  const results = await Promise.all([save("First"), save("Second")])
  assert.deepEqual(results.map(result => result.status).sort(), [200, 409])
  const reread = await request("GET")
  assert.equal(reread.body.revision, results.find(result => result.status === 200).body.revision)
  assert.equal(reread.body.activities[0].performances[0].episode, parse(await readFile(childPath, "utf8")).performances[0].episode)
})

test("one save can change the parent and child while preserving the split structure", async t => {
  const { parentPath, childPath, request } = await childScheduleFixture(t)
  const initial = await request("GET")
  const activities = initial.body.activities
  activities[0].title = { ja: "更新", en: "Updated" }
  activities[0].performances[0].link = "https://example.com/updated"
  assert.equal((await request("PUT", { activities, revision: initial.body.revision })).status, 200)
  const parent = parse(await readFile(parentPath, "utf8"))[0]
  const child = parse(await readFile(childPath, "utf8"))
  assert.equal(parent.title.en, "Updated")
  assert.equal(parent.performances, undefined)
  assert.equal(child.performances[0].link, "https://example.com/updated")
  assert.deepEqual((await request("GET")).body.activities, activities)
})

test("a failed later file replacement rolls back earlier child changes", async t => {
  const { directory, parentPath, childPath } = await childScheduleFixture(t)
  const { readActivityDocuments, writeActivityDocuments } = await server.ssrLoadModule("/tools/content-editor/activityDocuments.ts")
  const snapshot = await readActivityDocuments(directory)
  const originalParent = await readFile(parentPath, "utf8")
  const originalChild = await readFile(childPath, "utf8")
  const changes = new Map([
    ["activity-schedules/example-program.yaml", originalChild + "# Temporary change\n"],
    ["missing-directory/failure.yaml", "performances: []\n"],
  ])
  await assert.rejects(() => writeActivityDocuments(directory, snapshot, changes))
  assert.equal(await readFile(childPath, "utf8"), originalChild)
  assert.equal(await readFile(parentPath, "utf8"), originalParent)
})
