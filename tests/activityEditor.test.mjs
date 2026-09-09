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

const { validateActivities } = await server.ssrLoadModule("/src/editor/activityValidation.ts")
const { updateActivityDocument } = await server.ssrLoadModule("/tools/content-editor/vitePlugin.ts")
const { getPerformanceOccurrences } = await server.ssrLoadModule("/src/utils/activitySchedule.ts")
const source = fs.readFileSync("src/data/activities.yaml", "utf8")
const activities = parse(source)

test("the current activity file has stable unique IDs and passes editor validation", () => {
  assert.equal(activities.length, 28)
  assert.equal(new Set(activities.map((activity) => activity.id)).size, activities.length)
  assert.deepEqual(validateActivities(activities), [])
})

test("the Hong Kong doors-open milestone survives schedule normalization", () => {
  const activity = activities.find((item) => item.id === "2026-hong-kong-fan-meeting")
  const [matinee] = getPerformanceOccurrences(activity.performances)
  assert.deepEqual(matinee.milestones, [{ kind: "doors", at: "14:30" }])
})

test("validation rejects duplicate IDs and invalid nested schedules", () => {
  const invalid = structuredClone(activities)
  invalid[1].id = invalid[0].id
  invalid[2].performances = [{ startAt: "2026-09-12T18:00", occursOn: "2026-09-12" }]
  const issues = validateActivities(invalid)
  assert.ok(issues.some((issue) => issue.path === "activities[1].id"))
  assert.ok(issues.some((issue) => issue.path === "activities[2].performances[0]"))
})

test("ticket boundaries accept either dates or precise times but reject legacy pairs", () => {
  const mixedPrecision = structuredClone(activities)
  mixedPrecision[0].ticketInfo = {
    entries: [{
      type: { ja: "一般発売", en: "General Sale" },
      scheduleLabel: "2026.09.10-09.12",
      startAt: "2026-09-10T12:00",
      endAt: "2026-09-12",
    }],
  }
  assert.deepEqual(validateActivities(mixedPrecision), [])

  mixedPrecision[0].ticketInfo.entries[0].startDate = "2026-09-10"
  const issues = validateActivities(mixedPrecision)
  assert.ok(issues.some((issue) => issue.message.includes("startDate/endDate 已停用")))
})

test("weekly and manual recurrence enforce separate schedule sources", () => {
  const invalid = structuredClone(activities)
  const weekly = invalid.find((activity) => activity.id === "maison-de-coco")
  weekly.performances = [{ occursOn: "2026-09-04" }]
  const manual = invalid.find((activity) => activity.id === "tricolor")
  manual.performances = []
  invalid[0].recurring = true

  const issues = validateActivities(invalid)
  assert.ok(issues.some((issue) => issue.message.includes("weekly 循环活动由规则生成场次")))
  assert.ok(issues.some((issue) => issue.message.includes("manual 循环活动至少需要一个手动场次")))
  assert.ok(issues.some((issue) => issue.message.includes("recurring 已停用")))
})

test("YAML updates retain the reference header and comments on untouched records", () => {
  const next = structuredClone(activities)
  next[2].description.ja = "更新後の説明"
  const output = updateActivityDocument(source, next)
  assert.match(output, /# 数据结构参考/)
  assert.match(output, /# - id: "2026-example-event"/)
  assert.match(output, /# -{20,}/)
  assert.match(output, /# endAt: "2026-08-16"/)
  assert.match(output, /ja: "更新後の説明"/)
  assert.equal(parse(output)[2].description.ja, "更新後の説明")
  assert.deepEqual(validateActivities(parse(output)), [])
})
