import assert from "node:assert/strict"
import { after, test } from "node:test"
import { createServer } from "vite"
import yaml from "@modyfi/vite-plugin-yaml"

const server = await createServer({
  configFile: false,
  plugins: [yaml()],
  ssr: { resolve: { conditions: ["module"] }, noExternal: ["react-router-dom", "react-router"] },
  esbuild: { jsx: "automatic" },
  server: { middlewareMode: true, ws: false, watch: null },
  optimizeDeps: { noDiscovery: true, include: [] },
  appType: "custom",
})
after(() => server.close())
const { createPageLoader, pageLoaders, preloadPage } = await server.ssrLoadModule("/src/utils/pageLoaders.ts")

test("preloading and lazy rendering share one in-flight import and reuse its result", async () => {
  let resolve
  let imports = 0
  const load = createPageLoader(() => {
    imports++
    return new Promise(done => { resolve = done })
  })
  assert.equal(imports, 0)
  const preload = load()
  const render = load()
  assert.equal(preload, render)
  assert.equal(imports, 1)
  const module = { default: "Page" }
  resolve(module)
  assert.equal(await preload, module)
  assert.equal(await load(), module)
  assert.equal(imports, 1)
})

test("a failed speculative import can be retried on navigation", async () => {
  let attempts = 0
  const load = createPageLoader(async () => {
    if (++attempts === 1) throw new Error("Temporary network failure")
    return { default: "Page" }
  })
  await assert.rejects(load(), /Temporary network failure/)
  assert.deepEqual(await load(), { default: "Page" })
  assert.equal(attempts, 2)
})

test("preloading the Museum loads its entry page without loading archive data or results", async () => {
  const module = await preloadPage("/museum")
  assert.equal(typeof module.default, "function")
  assert.equal(module, await pageLoaders.museum())
  // Vite registers dynamic import URLs before loading them; only count evaluated modules.
  const modules = [...server.moduleGraph.idToModuleMap.values()]
    .filter(module => module.ssrModule)
    .map(module => module.id)
  assert.ok(!modules.some(id => id.includes("/src/data/") && id.endsWith(".yaml")))
  assert.ok(!modules.some(id => id.endsWith("/MuseumSearchResults.tsx")))
})

test("unknown routes have nothing to preload", () => {
  assert.equal(preloadPage("/not-a-route"), undefined)
})
