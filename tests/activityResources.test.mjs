import assert from "node:assert/strict"
import { after, test } from "node:test"
import { readFileSync } from "node:fs"
import { parse } from "yaml"
import { createServer } from "vite"
import yaml from "@modyfi/vite-plugin-yaml"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
const server = await createServer({ configFile: false, plugins: [yaml()], ssr: { resolve: { conditions: ["module"] }, noExternal: ["react-router-dom", "react-router"] }, esbuild: { jsx: "automatic" }, server: { middlewareMode: true, ws: false, watch: null }, optimizeDeps: { noDiscovery: true, include: [] }, appType: "custom" })
after(() => server.close())
const { filterActivityResources } = await server.ssrLoadModule("/src/utils/activityResources.ts")
const samples = [
  { activityId: "a", kind: "post", platform: "x", date: "2026-08-01", url: "https://example.com/a-1" },
  { activityId: "b", kind: "post", platform: "instagram", date: "2026-09-01", url: "https://example.com/b-1" },
  { activityId: "a", kind: "photo", platform: "web", date: "2026-09-02", url: "https://example.com/a-2" },
  { activityId: "a", kind: "photo", platform: "x", date: "2026-09-03", links: ["https://x.com/one/status/1", { url: "https://x.com/two/status/2", date: "2026-09-04" }] },
]
test("filters combine, sort by publication date, and do not mutate source order", () => {
  assert.deepEqual(filterActivityResources(samples, "a").map(r => r.date), ["2026-09-03", "2026-09-02", "2026-08-01"])
  assert.equal(filterActivityResources(samples, "a", "post").length, 1)
  assert.equal(filterActivityResources(samples, "b", "photo").length, 0)
  assert.equal(filterActivityResources(samples, "unknown").length, 0)
  assert.equal(filterActivityResources(samples)[0].date, "2026-09-03")
  assert.equal(samples[0].date, "2026-08-01")
})
test("published resource YAML has valid activity references and display fields", () => {
  const activities = parse(readFileSync("src/data/activities.yaml", "utf8"))
  const ids = new Set(activities.map(a => a.id))
  const resources = parse(readFileSync("src/data/activity-resources.yaml", "utf8"))
  const urls = new Set()
  for (const resource of resources) {
    assert.ok(ids.has(resource.activityId), `Unknown activity: ${resource.activityId}`)
    assert.match(resource.date, /^\d{4}-\d{2}-\d{2}$/)
    assert.equal(new Date(resource.date).toISOString().slice(0, 10), resource.date)
    assert.ok(["announcement", "merchandise", "post", "photo", "video", "report", "other"].includes(resource.kind))
    assert.ok(resource.title.ja && resource.title.en)
    assert.ok(["x", "instagram", "youtube", "web", "other"].includes(resource.platform))
    assert.notEqual(Boolean(resource.url), Boolean(resource.links), "Each resource must have exactly one of url or links")
    const links = resource.links ?? [resource.url]
    assert.ok(links.length > 0, "Resource collections cannot be empty")
    for (const link of links) {
      const details = typeof link === "string" ? { url: link } : link
      assert.ok(["https:", "http:"].includes(new URL(details.url).protocol))
      assert.ok(!urls.has(details.url), `Duplicate resource URL: ${details.url}`)
      urls.add(details.url)
      if (details.date) assert.match(details.date, /^\d{4}-\d{2}-\d{2}$/)
      assert.ok(details.status === undefined || ["available", "expired"].includes(details.status))
    }
    assert.ok(resource.status === undefined || ["available", "expired"].includes(resource.status))
  }
})
test("activity resources render inline in a collapsed disclosure", async () => {
  const { MemoryRouter } = await server.ssrLoadModule("react-router-dom")
  const { default: Disclosure } = await server.ssrLoadModule("/src/components/ActivityResourcesDisclosure.tsx")
  const html = renderToStaticMarkup(createElement(MemoryRouter, null, createElement(Disclosure, { activityId: "2026-piano-bar-claps", lang: "en" })))
  assert.match(html, /Related resources \(12\)/)
  assert.match(html, /View links \(9\)/)
  assert.match(html, /@artistslinks/)
  assert.match(html, /<details class="catalog-disclosure">/)
  assert.doesNotMatch(html, /<details[^>]*\bopen/)
  assert.ok(html.includes("“Thank You!” Dance"))
})
