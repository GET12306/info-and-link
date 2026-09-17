import assert from "node:assert/strict"
import { after, test } from "node:test"
import { createServer } from "vite"
import yaml from "@modyfi/vite-plugin-yaml"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
const server = await createServer({ configFile: false, plugins: [yaml()], ssr: { resolve: { conditions: ["module"] }, noExternal: ["react-router-dom", "react-router"] }, esbuild: { jsx: "automatic" }, server: { middlewareMode: true, ws: false, watch: null }, optimizeDeps: { noDiscovery: true, include: [] }, appType: "custom" })
after(() => server.close())
const { archiveText, filterMagazines } = await server.ssrLoadModule("/src/utils/magazines.ts")
test("minimal records and partially translated copy are supported", () => {
  assert.equal(archiveText({ ja: "掲載誌", en: "Magazine title" }, "ja"), "掲載誌")
  assert.equal(archiveText({ ja: "掲載誌", en: "Magazine title" }, "en"), "Magazine title")
  assert.equal(archiveText({ ja: "掲載誌" }, "en"), "掲載誌")
  assert.equal(archiveText("Magazine", "ja"), "Magazine")
  assert.equal(archiveText(undefined, "en"), "")
  assert.equal(filterMagazines([{ title: "Minimal" }], "", "", "ja").length, 1)
})
test("partial dates sort ahead of undated entries without inventing dates", () => {
  const entries = [{title:"Unknown"},{title:"Year",publicationDate:"2024"},{title:"Month",publicationDate:"2025-03"}]
  assert.deepEqual(filterMagazines(entries,"","","ja").map(e=>e.title),["Month","Year","Unknown"])
  assert.deepEqual(filterMagazines(entries,"","2024","ja").map(e=>e.title),["Year"])
})
test("search covers both languages and normalizes full-width text", () => {
  const entries=[{ title:{ja:"掲載誌",en:"Magazine A"},feature:"ＩＮＴＥＲＶＩＥＷ" }]
  assert.equal(filterMagazines(entries,"interview","","en").length,1)
  assert.equal(filterMagazines(entries,"掲載誌","","en").length,1)
  assert.equal(filterMagazines(entries,"missing","","en").length,0)
})

test("real magazine YAML renders localized titles, page descriptions, and publishers", async () => {
  const { default: data } = await server.ssrLoadModule("/src/data/magazines.yaml")
  assert.equal(typeof data[0].title, "object")
  assert.equal(archiveText(data[0].title, "ja"), "My Girl vol.37")
  assert.equal(archiveText(data[0].title, "en"), "My Girl vol.37")
  const localizedTitle = data.find(entry => entry.id === "sei-g-2026-05").title
  assert.equal(archiveText(localizedTitle, "ja"), "声優グランプリ 2026年5月号")
  assert.equal(archiveText(localizedTitle, "en"), "Voice Actor Grand Prix, May 2026 Issue")

  const { MemoryRouter } = await server.ssrLoadModule("react-router-dom")
  const { default: Media } = await server.ssrLoadModule("/src/pages/Media.tsx")
  for (const [lang, expectedTitle, hiddenTitle, expectedPage, expectedPublisher] of [
    ["ja", "声優グランプリ 2026年5月号", "Voice Actor Grand Prix, May 2026 Issue", "表紙・34ページ特集", "コスミック出版"],
    ["en", "Voice Actor Grand Prix, May 2026 Issue", "声優グランプリ 2026年5月号", "Cover · 34-Page Feature", "Cosmic Publishing"],
  ]) {
    const html = renderToStaticMarkup(createElement(MemoryRouter, null, createElement(Media, { lang })))
    assert.ok(html.includes("My Girl vol.37"))
    assert.ok(html.includes("My Girl vol.39"))
    assert.ok(html.includes(expectedTitle))
    assert.ok(!html.includes(hiddenTitle))
    assert.ok(html.includes(expectedPage))
    assert.ok(html.includes(expectedPublisher))
    assert.ok(html.includes("68-75"))
    assert.ok(!html.includes("[object Object]"))
  }
})
