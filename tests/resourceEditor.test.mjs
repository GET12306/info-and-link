import assert from "node:assert/strict"
import fs from "node:fs"
import { after, test } from "node:test"
import { parse } from "yaml"
import { createServer } from "vite"
import yaml from "@modyfi/vite-plugin-yaml"

const server = await createServer({
  configFile: false,
  plugins: [yaml()],
  server: { middlewareMode: true, ws: false, watch: null },
  optimizeDeps: { noDiscovery: true, include: [] },
  appType: "custom",
})
after(() => server.close())

const { RESOURCE_DOCUMENT_KEYS } = await server.ssrLoadModule("/src/editor/resourceEditorSchema.ts")
const { validateResourceDocument } = await server.ssrLoadModule("/src/editor/resourceValidation.ts")
const { updateListDocument } = await server.ssrLoadModule("/tools/content-editor/vitePlugin.ts")
const activityIds = new Set(parse(fs.readFileSync("src/data/activities.yaml", "utf8")).map(item => item.id))

test("all current resource files pass their editor validation", () => {
  for (const key of RESOURCE_DOCUMENT_KEYS) {
    const entries = parse(fs.readFileSync(`src/data/${key}.yaml`, "utf8"))
    assert.ok(Array.isArray(entries), key)
    assert.deepEqual(validateResourceDocument(key, entries, key === "activity-resources" ? activityIds : undefined), [], key)
  }
})

test("untouched records and YAML reference comments survive edits and additions", () => {
  for (const key of RESOURCE_DOCUMENT_KEYS) {
    const source = fs.readFileSync(`src/data/${key}.yaml`, "utf8")
    const original = parse(source)
    const next = structuredClone(original)
    next.push(structuredClone(original[0]))
    const output = updateListDocument(source, next)
    assert.deepEqual(parse(output), next, key)
    assert.equal(output.slice(0, source.indexOf("\n- ")), source.slice(0, source.indexOf("\n- ")), key)
  }
})

test("nested resource link alternatives and required fields are validated", () => {
  const entry = {
    activityId: [...activityIds][0], date: "2026-09-18", kind: "photo", platform: "x",
    title: { ja: "写真", en: "Photos" },
    links: ["https://x.com/example/status/1", { url: "https://x.com/example/status/2", date: "2026-09-19" }],
  }
  assert.deepEqual(validateResourceDocument("activity-resources", [entry], activityIds), [])
  const invalid = { ...entry, url: "https://example.com", date: "2026-02-30" }
  const issues = validateResourceDocument("activity-resources", [invalid], activityIds)
  assert.ok(issues.some(issue => issue.message.includes("url 与 links")))
  assert.ok(issues.some(issue => issue.path.endsWith(".date")))
})

test("everyday posts require a primary URL and accept optional related links", () => {
  const series = {
    id: "daily-series", title: "一日の投稿", url: "https://x.com/example/status/original", date: "2026-09-21", platform: "x",
    links: [
      "https://x.com/example/status/1",
      { url: "https://x.com/example/status/2", label: { ja: "返信" }, date: "2026-09-22" },
    ],
    tags: ["日常", { ja: "写真", en: "Photos" }],
  }
  assert.deepEqual(validateResourceDocument("daily-posts", [series]), [])
  const { url: _url, ...withoutPrimaryUrl } = series
  const issues = validateResourceDocument("daily-posts", [withoutPrimaryUrl])
  assert.ok(issues.some(issue => issue.path.endsWith(".url") && issue.message.includes("必填")))
})


test("partial translations reject non-text values in either supplied language", () => {
  for (const title of [{ ja: { bad: "object" }, en: "Valid" }, { ja: "有効", en: 123 }, { ja: null, en: "Valid" }]) {
    assert.ok(validateResourceDocument("magazines", [{ title }]).some(issue => issue.path.startsWith("magazines[0].title.")))
  }
  for (const title of ["Plain", { ja: "日本語" }, { en: "English" }, { ja: "", en: "English" }]) {
    assert.deepEqual(validateResourceDocument("magazines", [{ title }]), [])
  }
})

test("duplicate URLs are rejected within a resource group, including mixed link forms", () => {
  const entry = { title: "Photos", relatedResources: [{ kind: "photo", platform: "x", title: "Group", links: [
    "https://example.com/photo", { url: "https://example.com/photo", date: "2026-09-11" },
  ] }] }
  assert.ok(validateResourceDocument("magazines", [entry]).some(issue => issue.message.includes("不能重复")))
  entry.relatedResources[0].links[1].url = "https://example.com/second"
  assert.deepEqual(validateResourceDocument("magazines", [entry]), [])
})
