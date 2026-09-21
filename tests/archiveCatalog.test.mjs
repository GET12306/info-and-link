import assert from "node:assert/strict"
import { after, test } from "node:test"
import { createServer } from "vite"
import yaml from "@modyfi/vite-plugin-yaml"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
const server = await createServer({ configFile: false, plugins: [yaml()], ssr: { resolve: { conditions: ["module"] }, noExternal: ["react-router-dom", "react-router"] }, esbuild: { jsx: "automatic" }, server: { middlewareMode: true, ws: false, watch: null }, optimizeDeps: { noDiscovery: true, include: [] }, appType: "custom" })
after(() => server.close())
const { MemoryRouter } = await server.ssrLoadModule("react-router-dom")
const { default: Entry } = await server.ssrLoadModule("/src/components/ArchivedActivityEntry.tsx")
const base = { id: "test", title: {ja:"公演",en:"Show"}, category:"Live",scheduleLabel:"2025.01.01",link:"https://example.com/show" }
const render = activity => renderToStaticMarkup(createElement(MemoryRouter,null,createElement(Entry,{activity,lang:"en"})))
test("ticket records are inline, initially collapsed, and preserve all entries including undated ones",()=>{
  const html=render({...base,ticketInfo:{link:"https://example.com/tickets",price:{ja:"共通料金",en:"Shared price"},entries:[{type:{ja:"抽選",en:"Lottery"},scheduleLabel:"2024.12",description:{ja:"記録",en:"Archived note"}},{type:{ja:"一般",en:"General"},scheduleLabel:"2024.12.20",price:{ja:"個別料金",en:"Specific price"},link:"https://example.com/general"}]}})
  assert.match(html,/Ticket records \(2\)/)
  assert.match(html,/<details class="catalog-disclosure">/)
  assert.doesNotMatch(html,/<details[^>]*\bopen/)
  for(const text of ["Lottery","General","Shared price","Specific price","Archived note","https://example.com/tickets","https://example.com/general"]) assert.ok(html.includes(text))
})
test("activities without ticket entries do not show an empty disclosure",()=>{
  assert.ok(!render(base).includes("Ticket records"))
  assert.ok(!render({...base,ticketInfo:{entries:[]}}).includes("Ticket records"))
})
test("archived performance schedules use the same compact disclosure as other records",()=>{
  const html=render({...base,performances:[{startAt:"2025-01-01T18:00"}]})
  assert.match(html,/<details class="catalog-disclosure">\s*<summary[^>]*>Performance Schedule \(1\)<\/summary>/)
  assert.doesNotMatch(html,/aria-label="Performance Schedule"/)
  assert.doesNotMatch(html,/rounded-full[^>]*>[^<]*<svg[^>]*lucide-calendar-clock/)
})
test("all remaining archive pages render the shared compact layout", async()=>{
  for(const page of ["PastActivities","Programs","Credits","Media"]){
    const {default: Page}=await server.ssrLoadModule(`/src/pages/${page}.tsx`)
    const html=renderToStaticMarkup(createElement(MemoryRouter,null,createElement(Page,{lang:"ja"})))
    assert.ok(html.includes('class="archive-catalog"'),page)
    assert.ok(html.includes('class="catalog-grid"'),page)
  }
})
test("past activities expose the shared category filters and result count", async()=>{
  const {default: PastActivities}=await server.ssrLoadModule("/src/pages/PastActivities.tsx")
  const html=renderToStaticMarkup(createElement(MemoryRouter,null,createElement(PastActivities,{lang:"ja"})))
  assert.match(html,/role="group" aria-label="活動を種類で絞り込む"/)
  assert.match(html,/>すべて<\/button>/)
  assert.match(html,/>ミュージカル<\/button>/)
  assert.match(html,/aria-pressed="true"/)
  assert.match(html,/role="status"/)
})
test("linked and unlinked archive titles share the same typography", async()=>{
  const { CatalogEntryTitle, CatalogItemTitle, CatalogDisclosure }=await server.ssrLoadModule("/src/components/ArchiveCatalog.tsx")
  const plain=renderToStaticMarkup(createElement(CatalogEntryTitle,null,"Plain title"))
  const linked=renderToStaticMarkup(createElement(MemoryRouter,null,createElement(CatalogEntryTitle,{href:"https://example.com"},"Linked title")))
  for(const html of [plain,linked]) assert.match(html,/<h2 class="[^"]*font-serif text-base font-normal leading-6"/)
  assert.match(linked,/<a [^>]*>\s*<span class="min-w-0">Linked title<\/span><\/a>/)
  const item=renderToStaticMarkup(createElement(CatalogItemTitle,{href:"https://example.com"},"Related title"))
  assert.match(item,/<h3 class="[^"]*font-serif text-sm font-normal leading-6"/)
  assert.match(item,/transition-colors hover:text-coco-accent/)
  assert.doesNotMatch(item,/hover:underline/)
  const disclosure=renderToStaticMarkup(createElement(CatalogDisclosure,{label:"Records"},"Details"))
  assert.match(disclosure,/text-coco-ink\/65/)
  assert.doesNotMatch(disclosure,/font-medium text-coco-accent/)
})

test("programs and every media entry use the shared related-resource disclosure", async()=>{
  const relatedResources=[{
    date:"2026-08-28",kind:"photo",platform:"x",title:{ja:"関連写真",en:"Related photos"},
    links:["https://x.com/person_a/status/1","https://x.com/person_b/status/2"]
  }]
  const {default: RelatedResourcesDisclosure}=await server.ssrLoadModule("/src/components/RelatedResourcesDisclosure.tsx")
  const shared=renderToStaticMarkup(createElement(RelatedResourcesDisclosure,{resources:relatedResources,lang:"en"}))
  assert.match(shared,/Related resources \(2\)/)
  assert.match(shared,/View links \(2\)/)
  assert.match(shared,/@person_a/)
  assert.doesNotMatch(shared,/<details[^>]*\bopen/)
  assert.doesNotMatch(shared,/border-t/)

  const {default: Programs}=await server.ssrLoadModule("/src/pages/Programs.tsx")
  const programs=renderToStaticMarkup(createElement(MemoryRouter,null,createElement(Programs,{lang:"en"})))
  assert.match(programs,/The Love Card Club: The Path to Becoming the Strongest Player!! The 16th/)
  assert.match(programs,/Related resources \(2\)/)

  const fixtures=[
    ["/src/components/MagazineEntry.tsx",{entry:{title:"Issue",relatedResources},lang:"en"}],
    ["/src/components/NoteEntry.tsx",{note:{title:{ja:"記事",en:"Article"},relatedResources},lang:"en"}],
    ["/src/components/PhotoBookEntry.tsx",{book:{id:"book",title:{ja:"写真集",en:"Book"},releaseDate:"2026-01-01",description:{ja:"説明",en:"Description"},publisher:"Publisher",links:[],relatedResources},lang:"en"}],
  ]
  for(const [path,props] of fixtures){
    const {default: Component}=await server.ssrLoadModule(path)
    const html=renderToStaticMarkup(createElement(MemoryRouter,null,createElement(Component,props)))
    assert.match(html,/Related resources \(2\)/,path)
  }
})
