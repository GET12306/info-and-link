import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { test } from "node:test"
import { parse } from "yaml"

const files = [
  "src/data/programs.yaml",
  "src/data/photobooks.yaml",
  "src/data/magazines.yaml",
  "src/data/notes.yaml",
]
const kinds = new Set(["announcement", "merchandise", "post", "photo", "video", "report", "other"])
const platforms = new Set(["x", "instagram", "youtube", "web", "other"])

function hasText(value) {
  if (typeof value === "string") return value.length > 0
  return value && Object.values(value).some(text => typeof text === "string" && text.length > 0)
}

test("all archive relatedResources use the shared single-or-bulk schema", () => {
  let resourceCount = 0
  for (const file of files) {
    const records = parse(readFileSync(file, "utf8"))
    for (const [recordIndex, record] of records.entries()) {
      for (const [resourceIndex, resource] of (record.relatedResources ?? []).entries()) {
        const location = `${file}[${recordIndex}].relatedResources[${resourceIndex}]`
        resourceCount++
        assert.ok(kinds.has(resource.kind), `${location}: invalid kind`)
        assert.ok(platforms.has(resource.platform), `${location}: invalid platform`)
        assert.ok(hasText(resource.title), `${location}: title is required`)
        if (resource.date) assert.match(resource.date, /^\d{4}-\d{2}-\d{2}$/, `${location}: invalid date`)
        assert.notEqual(Boolean(resource.url), Boolean(resource.links), `${location}: use exactly one of url or links`)
        const links = resource.links ?? [resource.url]
        assert.ok(links.length > 0, `${location}: links cannot be empty`)
        const seen = new Set()
        for (const link of links) {
          const details = typeof link === "string" ? { url: link } : link
          assert.ok(["https:", "http:"].includes(new URL(details.url).protocol), `${location}: invalid URL`)
          assert.ok(!seen.has(details.url), `${location}: duplicate URL`)
          seen.add(details.url)
          if (details.date) assert.match(details.date, /^\d{4}-\d{2}-\d{2}$/, `${location}: invalid link date`)
          if (details.platform) assert.ok(platforms.has(details.platform), `${location}: invalid link platform`)
        }
      }
    }
  }
  assert.ok(resourceCount > 0, "Expected at least one published related resource")
})
