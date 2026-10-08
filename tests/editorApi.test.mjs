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
  assert.deepEqual(result.body.activityReferences, [{ id: base.id, title: base.title }])
})
