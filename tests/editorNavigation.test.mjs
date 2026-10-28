import assert from "node:assert/strict"
import { after, test } from "node:test"
import { createServer } from "vite"

const server = await createServer({ configFile: false, server: { middlewareMode: true, ws: false, watch: null }, optimizeDeps: { noDiscovery: true, include: [] }, appType: "custom" })
after(() => server.close())
const { activityReference, activitySearchText, compareEditorActivities, groupActivityResourceEntries } = await server.ssrLoadModule("/src/editor/activityNavigation.ts")
const base = { category: "Event", title: { ja: "台北公演", en: "Taipei Meeting" }, scheduleLabel: "2026.09", link: "https://example.com" }

test("editor ordering uses earliest actual performance, newest first, and retains ties and unknown dates", () => {
  const source = [
    { ...base, id: "old", performances: [{ startAt: "2026-10-25T20:00" }, { startAt: "2026-09-01T18:00" }] },
    { ...base, id: "unknown" },
    { ...base, id: "new", startDate: "2026-10-01" },
    { ...base, id: "tie", performances: [{ occursOn: "2026-10-01" }] },
    { ...base, id: "weekly", recurrence: { type: "weekly", startOn: "2026-09-28", endOn: "2026-10-10", weekday: "friday", startTime: "22:00" } },
  ]
  const references = source.map(activityReference).sort(compareEditorActivities)
  assert.deepEqual(references.map(item => item.id), ["weekly", "new", "tie", "old", "unknown"])
  assert.equal(references.find(item => item.id === "old").startAt, "2026-09-01T18:00")
  assert.deepEqual(source.map(item => item.id), ["old", "unknown", "new", "tie", "weekly"])
  assert.match(activitySearchText(references[0]), /台北公演 Taipei Meeting/)
  assert.match(activitySearchText(references[0]), /2026-10-02/)
})

test("resource groups follow activity dates and preserve original entry indexes for editing", () => {
  const references = new Map([
    ["old", activityReference({ ...base, id: "old", startDate: "2025-01-01" })],
    ["new", activityReference({ ...base, id: "new", startDate: "2026-01-01" })],
  ])
  const entries = ["old", "new", "old", "missing"].map((activityId, index) => ({ entry: { activityId }, index }))
  const groups = groupActivityResourceEntries(entries, references)
  assert.deepEqual(groups.map(group => group.activityId), ["new", "old", "missing"])
  assert.deepEqual(groups[1].entries.map(item => item.index), [0, 2])
  assert.deepEqual(entries.map(item => item.index), [0, 1, 2, 3])
  assert.deepEqual(groupActivityResourceEntries([], references), [])
})
