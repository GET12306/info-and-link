import assert from "node:assert/strict"
import fs from "node:fs"
import { after, test } from "node:test"
import { parse } from "yaml"
import { createServer } from "vite"

const server = await createServer({
  configFile: false,
  server: { middlewareMode: true, ws: false, watch: null },
  optimizeDeps: { noDiscovery: true, include: [] },
  appType: "custom",
})
after(() => server.close())

const { validateVenues } = await server.ssrLoadModule("/src/editor/venueValidation.ts")
const { parseVenueDocument, updateVenueDocument } = await server.ssrLoadModule("/tools/content-editor/vitePlugin.ts")
const source = fs.readFileSync("src/data/venues.yaml", "utf8")
const document = parse(source)

test("the current venue library passes editor validation", () => {
  assert.ok(document.venues.length > 0)
  assert.deepEqual(validateVenues(document.venues), [])
})

test("venue updates retain defaults, header comments, and untouched records", () => {
  const next = structuredClone(document.venues)
  next[1].name.en = "Updated venue name"
  const output = updateVenueDocument(source, next)
  const parsed = parseVenueDocument(output)

  assert.deepEqual(parsed.value.defaults, document.defaults)
  assert.equal(parsed.value.lastVerified, document.lastVerified)
  assert.equal(parsed.venues[1].name.en, "Updated venue name")
  assert.match(output, /# 场地资料库/)
  assert.match(output, /defaults:\n/)
  assert.match(output, /id: "theater-sunmall"/)
})

test("venue validation rejects duplicate IDs and missing sources", () => {
  const duplicate = structuredClone(document.venues.slice(0, 2))
  duplicate[1].id = duplicate[0].id
  duplicate[1].sources = []
  const issues = validateVenues(duplicate)
  assert.ok(issues.some(issue => issue.path === "venues[1].id"))
  assert.ok(issues.some(issue => issue.path === "venues[1].sources"))
})
