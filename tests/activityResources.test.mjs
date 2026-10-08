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
  { activityId: "a", kind: "post", platform: "x", links: [{ url: "https://example.com/a-1", date: "2026-08-01" }] },
  { activityId: "b", kind: "post", platform: "instagram", links: [{ url: "https://example.com/b-1", date: "2026-09-01" }] },
  { activityId: "a", kind: "photo", platform: "web", links: [{ url: "https://example.com/a-2", date: "2026-09-02" }] },
  { activityId: "a", kind: "photo", platform: "x", links: [
    { url: "https://x.com/one/status/1", date: "2026-09-03" },
    { url: "https://x.com/two/status/2", date: "2026-09-04" },
  ] },
]
test("filters combine, sort by publication date, and do not mutate source order", () => {
  assert.deepEqual(filterActivityResources(samples, "a").map(r => r.links.at(-1).date), ["2026-09-04", "2026-09-02", "2026-08-01"])
  assert.equal(filterActivityResources(samples, "a", "post").length, 1)
  assert.equal(filterActivityResources(samples, "b", "photo").length, 0)
  assert.equal(filterActivityResources(samples, "unknown").length, 0)
  assert.equal(filterActivityResources(samples)[0].links.at(-1).date, "2026-09-04")
  assert.equal(samples[0].links[0].date, "2026-08-01")
})
test("published resource YAML has valid activity references and display fields", () => {
  const activities = parse(readFileSync("src/data/activities.yaml", "utf8"))
  const ids = new Set(activities.map(a => a.id))
  const resources = parse(readFileSync("src/data/activity-resources.yaml", "utf8"))
  const urls = new Set()
  for (const resource of resources) {
    assert.ok(ids.has(resource.activityId), `Unknown activity: ${resource.activityId}`)
    assert.equal(resource.date, undefined, "Dates belong to individual links, not resource groups")
    assert.equal(resource.url, undefined, "Single resources also use links[]")
    assert.ok(["announcement", "merchandise", "post", "photo", "video", "report", "other"].includes(resource.kind))
    assert.ok(resource.title.ja && resource.title.en)
    assert.ok(["x", "instagram", "youtube", "web", "other"].includes(resource.platform))
    assert.ok(Array.isArray(resource.links) && resource.links.length > 0, "Resource groups require links")
    for (const link of resource.links) {
      assert.equal(typeof link, "object", "Activity resource links must use the detailed object form")
      assert.ok(["https:", "http:"].includes(new URL(link.url).protocol))
      assert.ok(!urls.has(link.url), `Duplicate resource URL: ${link.url}`)
      urls.add(link.url)
      assert.match(link.date, /^\d{4}-\d{2}-\d{2}$/)
      assert.equal(new Date(link.date).toISOString().slice(0, 10), link.date)
      assert.ok(link.status === undefined || ["available", "expired"].includes(link.status))
    }
    assert.ok(resource.status === undefined || ["available", "expired"].includes(resource.status))
  }
})
test("activity resources render inline in a collapsed disclosure", async () => {
  const { default: Disclosure } = await server.ssrLoadModule("/src/components/RelatedResourcesDisclosure.tsx")
  const resources = [
    { kind: "video", platform: "x", title: { ja: "動画", en: "Sample video" }, links: [
      { url: "https://example.com/video", date: "2026-09-03" },
    ] },
    { kind: "photo", platform: "x", title: { ja: "写真", en: "Sample photos" }, links: [
      { url: "https://x.com/artistslinks/status/1", date: "2026-09-02" },
      { url: "https://example.com/photo", date: "2026-09-01" },
    ] },
  ]
  const html = renderToStaticMarkup(createElement(Disclosure, { resources, lang: "en" }))
  assert.match(html, /Related resources \(3\)/)
  assert.match(html, /View links \(2\)/)
  assert.match(html, /@artistslinks/)
  assert.match(html, /href="https:\/\/example.com\/video"/)
  assert.match(html, /2026-09-03/)
  assert.ok(html.indexOf("2026-09-02") < html.indexOf("2026-09-01"), "Links are shown newest first inside a group")
  assert.match(html, /<details class="catalog-disclosure">/)
  assert.doesNotMatch(html, /<details[^>]*\bopen/)
  assert.ok(html.includes("Sample video"))
})
