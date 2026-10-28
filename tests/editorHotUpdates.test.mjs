import assert from "node:assert/strict"
import { after, test } from "node:test"
import { mkdtemp, mkdir, readFile, realpath, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { createServer } from "vite"
import yaml from "@modyfi/vite-plugin-yaml"

const loader = await createServer({ configFile: false, server: { middlewareMode: true, ws: false, watch: null }, optimizeDeps: { noDiscovery: true, include: [] }, appType: "custom" })
after(() => loader.close())
const { activityEditorPlugin } = await loader.ssrLoadModule("/tools/content-editor/vitePlugin.ts")

async function fixture(t, enabled = true) {
  const root = await realpath(await mkdtemp(path.join(tmpdir(), "editor-hot-updates-")))
  t.after(() => rm(root, { recursive: true, force: true }))
  await mkdir(path.join(root, "src/data/activity-schedules"), { recursive: true })
  const activity = { id: "example", category: "Event", title: { ja: "例", en: "Example" }, scheduleLabel: "2026.10.10", startDate: "2026-10-10", link: "https://example.com" }
  await writeFile(path.join(root, "src/data/activities.yaml"), JSON.stringify([activity]))
  await writeFile(path.join(root, "src/data/venues.yaml"), "venues: []\n")
  await writeFile(path.join(root, "src/data/activity-resources.yaml"), "[]\n")
  await writeFile(path.join(root, "preview.js"), 'import activities from "./src/data/activities.yaml"; import venues from "./src/data/venues.yaml"; import resources from "./src/data/activity-resources.yaml"; console.log(activities, venues, resources)')
  await writeFile(path.join(root, "editor.js"), 'import venues from "./src/data/venues.yaml"; console.log(venues)')
  const html = script => `<html><head></head><body><script type="module" src="/${script}.js"></script></body></html>`
  await writeFile(path.join(root, "index.html"), html("preview"))
  await writeFile(path.join(root, "editor.html"), html("editor"))
  const plugin = activityEditorPlugin(enabled)
  const server = await createServer({ root, configFile: false, plugins: [yaml(), plugin], server: { middlewareMode: true, ws: false, watch: null }, optimizeDeps: { noDiscovery: true, include: [] }, appType: "custom", logLevel: "silent" })
  t.after(() => server.close())
  await server.transformRequest("/preview.js")
  await server.transformRequest("/editor.js")
  for (const filename of ["activities.yaml", "venues.yaml", "activity-resources.yaml"]) {
    await server.transformRequest(`/src/data/${filename}?import`)
  }
  const messages = []
  server.environments.client.hot.send = payload => messages.push(payload)
  const changed = async (filename, contents, type = "change") => {
    const file = path.join(root, filename)
    await writeFile(file, contents)
    const sent = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error(`No update received for ${filename}`)), 3000)
      server.environments.client.hot.send = payload => { messages.push(payload); clearTimeout(timeout); resolve(payload) }
    })
    server.watcher.emit(type, file)
    await sent
  }
  return { root, server, messages, changed, html, plugin }
}

test("YAML writes notify the preview without broadcasting an editor reload, and invalidate cached data", async t => {
  const { server, changed, messages } = await fixture(t)
  for (const filename of ["activities.yaml", "venues.yaml", "activity-resources.yaml"]) {
    const contents = filename === "venues.yaml" ? 'venues: []\nlastVerified: "2026-10-27"\n' : "[]\n"
    await changed(`src/data/${filename}`, contents)
    assert.ok(!messages.some(message => message.type === "full-reload" || message.type === "update"), "Data saves must not reset the editor through Vite HMR")
    assert.equal(messages.at(-1).type, "custom")
    assert.equal(messages.at(-1).event, "content-editor:data-updated")
  }
  const updated = await server.transformRequest("/src/data/venues.yaml?import")
  assert.match(updated.code, /2026-10-27/, "Preview reloads read the updated YAML rather than a cached module")
  await changed("src/data/activity-schedules/program.yaml", "performances: []\n", "add")
  assert.equal(messages.at(-1).event, "content-editor:data-updated")
})

test("only the editor server's website preview subscribes to data reloads", async t => {
  const { root, server } = await fixture(t)
  const preview = await server.transformIndexHtml("/index.html", await readFile(path.join(root, "index.html"), "utf8"))
  const editor = await server.transformIndexHtml("/editor.html", await readFile(path.join(root, "editor.html"), "utf8"))
  // Vite may extract the injected module into an HTML proxy; inspect its transformed source too.
  const sources = [preview]
  for (const match of preview.matchAll(/src="([^"]*html-proxy[^\"]*)"/g)) {
    sources.push((await server.transformRequest(match[1].replaceAll("&amp;", "&"))).code)
  }
  assert.ok(sources.some(code => code.includes("content-editor:data-updated") && code.includes("location.reload")))
  assert.doesNotMatch(editor, /content-editor:data-updated|html-proxy/)
})

test("ordinary development data updates and editor source updates retain normal HMR", async t => {
  const normal = await fixture(t, false)
  await normal.changed("src/data/venues.yaml", "venues: []\nlastVerified: 2026-10-27\n")
  assert.ok(normal.messages.some(message => message.type === "full-reload"))
  const preview = await normal.server.transformIndexHtml("/index.html", await readFile(path.join(normal.root, "index.html"), "utf8"))
  assert.doesNotMatch(preview, /content-editor:data-updated|html-proxy/)

  const editor = await fixture(t)
  await editor.changed("editor.js", "console.log('source changed')")
  assert.ok(editor.messages.some(message => message.type === "full-reload"), "The fix must not disable source-code HMR")
})
