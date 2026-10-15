import assert from "node:assert/strict"
import { after, test } from "node:test"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { createServer } from "vite"
import yaml from "@modyfi/vite-plugin-yaml"

const server = await createServer({ configFile: false, plugins: [yaml()], ssr: { resolve: { conditions: ["module"] }, noExternal: ["react-router-dom", "react-router"] }, esbuild: { jsx: "automatic" }, server: { middlewareMode: true, ws: false, watch: null }, optimizeDeps: { noDiscovery: true, include: [] }, appType: "custom" })
after(() => server.close())
const { default: Entry } = await server.ssrLoadModule("/src/components/ArchivedAccountEntry.tsx")
const { buildMuseumSearchItems, filterMuseumItems } = await server.ssrLoadModule("/src/utils/museumSearch.ts")
const { validateResourceDocument } = await server.ssrLoadModule("/src/editor/resourceValidation.ts")
const { TRANSLATIONS } = await server.ssrLoadModule("/src/i18n.ts")

test("former accounts need only a title and URL, retain clickable titles, and support optional metadata", () => {
  const minimal = { title: { ja: "過去の番組" }, url: "https://twitter.com/former_program" }
  assert.deepEqual(validateResourceDocument("archived-accounts", [minimal]), [])
  const html = renderToStaticMarkup(createElement(Entry, { account: minimal, lang: "en" }))
  assert.match(html, /class="catalog-entry/)
  assert.match(html, /@former_program/)
  assert.match(html, /<h2[^>]*><a[^>]*href="https:\/\/twitter.com\/former_program"/)
  assert.match(html, /過去の番組/)
  assert.ok(!html.includes(TRANSLATIONS.en.resource_expired))
  assert.doesNotMatch(html, /<details|<input/)

  const detailed = renderToStaticMarkup(createElement(Entry, {
    account: { ...minimal, period: "2018-2023", description: "Former radio account", status: "expired" }, lang: "en",
  }))
  assert.match(detailed, /2018-2023/)
  assert.match(detailed, /Former radio account/)
  assert.ok(detailed.includes(TRANSLATIONS.en.resource_expired))
})

test("the museum links to the account catalogue and its page follows the current records", async () => {
  const { MemoryRouter } = await server.ssrLoadModule("react-router-dom")
  const { default: Museum } = await server.ssrLoadModule("/src/pages/Museum.tsx")
  const { default: Accounts } = await server.ssrLoadModule("/src/pages/ArchivedAccounts.tsx")
  const { default: accounts } = await server.ssrLoadModule("/src/data/archived-accounts.yaml")
  const museum = renderToStaticMarkup(createElement(MemoryRouter, null, createElement(Museum, { lang: "en" })))
  assert.match(museum, /href="\/museum\/accounts"/)
  assert.match(museum, /Past Accounts/)
  const page = renderToStaticMarkup(createElement(MemoryRouter, null, createElement(Accounts, { lang: "en" })))
  assert.match(page, /class="archive-catalog"/)
  assert.ok(page.includes(TRANSLATIONS.en.archived_accounts_count.replace("{count}", String(accounts.length))))
  if (accounts.length) {
    for (const account of accounts) assert.ok(page.includes(account.url))
  } else {
    assert.ok(page.includes(TRANSLATIONS.en.archived_accounts_empty))
  }
  assert.doesNotMatch(page, /<input|<select/)
})

test("museum search finds accounts by handle, description, and usage year", () => {
  const items = buildMuseumSearchItems({
    credits: [], activities: [], programs: [], photobooks: [], magazines: [], notes: [], dailyPosts: [],
    accounts: [{ title: "Former radio", url: "https://x.com/former_program", period: "2018-2023", description: "Archived photos" }],
  }, "en")
  assert.equal(filterMuseumItems(items, "@former_program", "accounts", "2020").length, 1)
  assert.equal(filterMuseumItems(items, "photos", "all", "").length, 1)
  assert.equal(filterMuseumItems(items, "", "accounts", "2024").length, 0)
  assert.equal(items[0].href, "https://x.com/former_program")
})
