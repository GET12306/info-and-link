import assert from "node:assert/strict"
import { after, test } from "node:test"
import { createServer } from "vite"
import yaml from "@modyfi/vite-plugin-yaml"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
const server = await createServer({ configFile: false, plugins: [yaml()], ssr: { resolve: { conditions: ["module"] }, noExternal: ["react-router-dom", "react-router"] }, esbuild: { jsx: "automatic" }, server: { middlewareMode: true, ws: false, watch: null }, optimizeDeps: { noDiscovery: true, include: [] }, appType: "custom" })
after(() => server.close())
const { dailyPostDate, dailyPostLinks, dailyPostPlatform, isDailyPostSeries, sortDailyPosts } = await server.ssrLoadModule("/src/utils/dailyPosts.ts")
const posts = [
  { title:{ja:"カフェ",en:"Cafe"},url:"https://x.com/example/status/1",date:"2026-09-19",tags:["ＣＯＦＦＥＥ"] },
  { title:"散歩",url:"https://www.instagram.com/p/example/",date:"2025-01-01",description:{ja:"公園"} },
  { title:"Undated",url:"https://example.com/post" },
]
test("recognizes platform domains without confusing lookalike domains",()=>{
  assert.equal(dailyPostPlatform(posts[0]),"x")
  assert.equal(dailyPostPlatform(posts[1]),"instagram")
  assert.equal(dailyPostPlatform({url:"https://mobile.twitter.com/example"}),"x")
  assert.equal(dailyPostPlatform({url:"https://x.com.example.com/post"}),"web")
  assert.equal(dailyPostPlatform({...posts[0],platform:"other"}),"other")
})
test("sorts newest first with undated posts last without mutating data",()=>{
  const input = [...posts].reverse()
  assert.deepEqual(sortDailyPosts(input), posts)
  assert.deepEqual(input, [...posts].reverse())
})
test("keeps a related post chain in one record and inherits series defaults",()=>{
  const series = {
    title: "Series", url: "https://x.com/example/status/original", platform: "x", status: "available",
    links: [
      "https://x.com/example/status/1",
      { url: "https://www.instagram.com/p/example/", label: { en: "Reply" }, date: "2026-09-21", platform: "instagram", status: "expired" },
    ],
  }
  assert.equal(isDailyPostSeries(series), true)
  assert.deepEqual(dailyPostLinks(series), [
    { url: "https://x.com/example/status/original", date: undefined, platform: "x", status: "available" },
    { url: "https://x.com/example/status/1", date: undefined, platform: "x", status: "available" },
    { url: "https://www.instagram.com/p/example/", label: { en: "Reply" }, date: "2026-09-21", platform: "instagram", status: "expired" },
  ])
  assert.equal(dailyPostDate(series), "2026-09-21")
})
test("page renders current records with catalogue primitives and no local search controls",async()=>{
  const {MemoryRouter}=await server.ssrLoadModule("react-router-dom")
  const {default: Page}=await server.ssrLoadModule("/src/pages/DailyPosts.tsx")
  const {default: currentPosts}=await server.ssrLoadModule("/src/data/daily-posts.yaml")
  const html=renderToStaticMarkup(createElement(MemoryRouter,null,createElement(Page,{lang:"en"})))
  const series = currentPosts.find(post => post.links?.length)
  assert.ok(series)
  assert.ok(html.includes('class="archive-catalog"'))
  assert.ok(html.includes("Everyday Posts"))
  assert.ok(html.includes(`Related posts (${series.links.length})`))
  const escapedUrl = series.url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  assert.match(html, new RegExp(`<h2[^>]*><a[^>]*href="${escapedUrl}"[^>]*>`))
  for (const link of series.links) assert.ok(html.includes(typeof link === "string" ? link : link.url))
  assert.ok(!html.includes('type="search"'))
  assert.ok(!html.includes("<select"))
})
