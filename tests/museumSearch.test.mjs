import assert from "node:assert/strict"
import { after, test } from "node:test"
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

const {
  expandMuseumDate,
  filterMuseumItems,
  normalizeMuseumDateQuery,
} = await server.ssrLoadModule("/src/utils/museumSearch.ts")

test("archive dates support years, months, days, and the existing range notation", () => {
  assert.deepEqual(expandMuseumDate("2024"), ["2024"])
  assert.deepEqual(expandMuseumDate("2024.07"), ["2024-07"])
  assert.deepEqual(expandMuseumDate("2023-2025"), ["2023", "2024", "2025"])
  assert.deepEqual(expandMuseumDate("2019.07-09"), ["2019-07", "2019-08", "2019-09"])
})

test("date input validates the requested precision", () => {
  assert.equal(normalizeMuseumDateQuery("2024"), "2024")
  assert.equal(normalizeMuseumDateQuery("2024/07"), "2024-07")
  assert.equal(normalizeMuseumDateQuery("2024-02-29"), "2024-02-29")
  assert.equal(normalizeMuseumDateQuery("2023-02-29"), null)
  assert.equal(normalizeMuseumDateQuery("2024-13"), null)
})

test("global filters combine collection, keyword, and date precision", () => {
  const items = [
    { id: "a", collection: "activities", title: "Tokyo", path: "/museum/activities", dates: ["2024-07-12"], searchText: "東京 tokyo" },
    { id: "b", collection: "media", title: "Magazine", path: "/museum/media", dates: ["2024-07"], searchText: "掲載誌 magazine" },
    { id: "c", collection: "programs", title: "Show", path: "/museum/programs", dates: ["2024"], searchText: "番組 show" },
  ]
  assert.deepEqual(filterMuseumItems(items, "", "all", "2024").map((item) => item.id), ["a", "b", "c"])
  assert.deepEqual(filterMuseumItems(items, "", "all", "2024-07").map((item) => item.id), ["a", "b"])
  assert.deepEqual(filterMuseumItems(items, "", "all", "2024-07-12").map((item) => item.id), ["a"])
  assert.deepEqual(filterMuseumItems(items, "tokyo", "activities", "2024").map((item) => item.id), ["a"])
  assert.deepEqual(filterMuseumItems(items, "tokyo", "media", "2024").map((item) => item.id), [])
})
