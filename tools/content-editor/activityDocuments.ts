import { createHash } from "node:crypto"
import { readFile, realpath, stat } from "node:fs/promises"
import path from "node:path"
import type { Activity } from "../../src/types"
import { attachActivitySchedules, scheduleFileReferences } from "../../src/utils/activityScheduleFiles"
import { replaceFile } from "./fileWrites"
import { parseListDocument, parsePerformanceDocument, updateListDocument, updatePerformanceDocument } from "./yamlDocuments"

export async function readActivityDocuments(dataDirectory: string) {
  const source = await readFile(path.join(dataDirectory, "activities.yaml"), "utf8")
  const raw = parseListDocument(source).activities as Activity[]
  const sources = new Map([["activities.yaml", source]])
  const schedules: Record<string, unknown> = {}
  const realDirectory = await realpath(dataDirectory)
  let modifiedAt = (await stat(path.join(dataDirectory, "activities.yaml"))).mtime
  for (const file of scheduleFileReferences(raw)) {
    const filename = path.join(dataDirectory, file)
    if (!(await realpath(filename)).startsWith(`${realDirectory}${path.sep}`)) {
      throw new Error(`日程文件不能指向数据目录之外：${file}`)
    }
    const childSource = await readFile(filename, "utf8")
    const performances = parsePerformanceDocument(childSource)
    schedules[file] = { performances }
    sources.set(file, childSource)
    const childModified = (await stat(filename)).mtime
    if (childModified > modifiedAt) modifiedAt = childModified
  }
  const revisionInput = sources.size === 1 ? source : JSON.stringify([...sources])
  return {
    activities: attachActivitySchedules(raw, schedules),
    revision: createHash("sha256").update(revisionInput).digest("hex"),
    modifiedAt: modifiedAt.toISOString(),
    path: "src/data/activities.yaml",
    sources,
  }
}

export function serializeActivityDocuments(snapshot: Awaited<ReturnType<typeof readActivityDocuments>>, activities: Activity[]) {
  scheduleFileReferences(activities)
  const documents = new Map<string, string>()
  const parents = activities.map(activity => {
    if (!activity.performancesFile) return activity
    const source = snapshot.sources.get(activity.performancesFile)
    if (source === undefined) throw new Error(`请先在 activities.yaml 中配置已有子文件：${activity.performancesFile}`)
    const { performances, ...parent } = activity
    documents.set(activity.performancesFile, updatePerformanceDocument(source, performances ?? []))
    return parent
  })
  documents.set("activities.yaml", updateListDocument(snapshot.sources.get("activities.yaml")!, parents))
  const schedules = Object.fromEntries([...documents].filter(([file]) => file !== "activities.yaml")
    .map(([file, source]) => [file, { performances: parsePerformanceDocument(source) }]))
  return { documents, activities: attachActivitySchedules(parseListDocument(documents.get("activities.yaml")!).activities as Activity[], schedules) }
}

/** Caller holds the bundle lock. Roll back earlier replacements if a later write fails. */
export async function writeActivityDocuments(dataDirectory: string, snapshot: Awaited<ReturnType<typeof readActivityDocuments>>, documents: Map<string, string>) {
  const written: string[] = []
  try {
    for (const [file, source] of documents) {
      if (source === snapshot.sources.get(file)) continue
      await replaceFile(path.join(dataDirectory, file), source)
      written.push(file)
    }
  } catch (error) {
    const rollbackErrors: unknown[] = []
    for (const file of written.reverse()) {
      try { await replaceFile(path.join(dataDirectory, file), snapshot.sources.get(file)!) }
      catch (rollbackError) { rollbackErrors.push(rollbackError) }
    }
    if (rollbackErrors.length) throw new AggregateError([error, ...rollbackErrors], "保存失败，部分文件未能恢复；请检查磁盘内容")
    throw error
  }
}
