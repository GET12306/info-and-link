import { createHash } from "node:crypto"
import { readFile, stat } from "node:fs/promises"
import path from "node:path"
import type { IncomingMessage, ServerResponse } from "node:http"
import type { Plugin } from "vite"
import type { Activity } from "../../src/types"
import { parseListDocument, parseVenueDocument, updateListDocument, updateVenueDocument } from "./yamlDocuments"
export { parseActivityDocument, updateActivityDocument, parseListDocument, updateListDocument, parseVenueDocument, updateVenueDocument } from "./yamlDocuments"
import { validateActivities } from "../../src/editor/activityValidation"
import { RESOURCE_DOCUMENT_KEYS, type ResourceDocumentKey } from "../../src/editor/resourceEditorSchema"
import { activityReference } from "../../src/editor/activityNavigation"
import { validateResourceDocument } from "../../src/editor/resourceValidation"
import { validateVenues } from "../../src/editor/venueValidation"

import { replaceFile, withFileWrite } from "./fileWrites"
import { readActivityDocuments, serializeActivityDocuments, writeActivityDocuments } from "./activityDocuments"

const API_PATH = "/__activity-editor/activities"
const VENUE_API_PATH = "/__activity-editor/venues"
const RESOURCE_API_PREFIX = "/__activity-editor/data/"
const MAX_REQUEST_BYTES = 2 * 1024 * 1024
const DATA_UPDATED_EVENT = "content-editor:data-updated"

function revisionFor(source: string) {
  return createHash("sha256").update(source).digest("hex")
}

function sendJson(
  response: ServerResponse,
  status: number,
  value: unknown
) {
  response.statusCode = status
  response.setHeader("Content-Type", "application/json; charset=utf-8")
  response.setHeader("Cache-Control", "no-store")
  response.end(JSON.stringify(value))
}

function isLoopbackRequest(request: IncomingMessage) {
  const address = request.socket.remoteAddress
  return address === "127.0.0.1" || address === "::1" || address === "::ffff:127.0.0.1"
}

async function readRequestBody(request: IncomingMessage) {
  let size = 0
  const chunks: Buffer[] = []
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    size += buffer.byteLength
    if (size > MAX_REQUEST_BYTES) throw new Error("请求内容超过 2 MB")
    chunks.push(buffer)
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown
}


export function activityEditorPlugin(enabled: boolean): Plugin {
  return {
    name: "local-activity-editor",
    apply: "serve",
    // Data is edited through the API. Broadcasting YAML HMR would reset every
    // open page, including drafts in the editor, when the preview imports it.
    hotUpdate: {
      order: "post",
      handler({ file, modules, server, timestamp }) {
        const dataDirectory = path.resolve(server.config.root, "src/data")
        if (!enabled || !path.resolve(file).startsWith(`${dataDirectory}${path.sep}`) || !/\.ya?ml$/i.test(file)) return
        for (const module of modules) this.environment.moduleGraph.invalidateModule(module, undefined, timestamp, true)
        if (this.environment.name === "client") {
          this.environment.hot.send({ type: "custom", event: DATA_UPDATED_EVENT, data: {} })
        }
        return []
      },
    },
    transformIndexHtml: {
      order: "pre",
      handler(_html, context) {
        if (!enabled || !context.server || context.filename !== path.resolve(context.server.config.root, "index.html")) return
        // Only the website preview subscribes; the editor retains its mounted
        // state and continues to read external changes through its guarded API.
        return [{
          tag: "script",
          attrs: { type: "module" },
          children: `if (import.meta.hot) import.meta.hot.on("${DATA_UPDATED_EVENT}", () => window.location.reload());`,
          injectTo: "head",
        }]
      },
    },
    configureServer(server) {
      if (!enabled) return
      const dataDirectory = path.resolve(server.config.root, "src/data")
      const dataPath = path.join(dataDirectory, "activities.yaml")
      const venuePath = path.join(dataDirectory, "venues.yaml")
      const resourceKeys = new Set<string>(RESOURCE_DOCUMENT_KEYS)

      server.middlewares.use(async (request, response, next) => {
        const requestUrl = new URL(request.url ?? "/", "http://localhost")
        const resourceKey = requestUrl.pathname.startsWith(RESOURCE_API_PREFIX)
          ? requestUrl.pathname.slice(RESOURCE_API_PREFIX.length)
          : null
        if (requestUrl.pathname !== API_PATH && requestUrl.pathname !== VENUE_API_PATH &&
            !resourceKeys.has(resourceKey ?? "")) return next()
        const isActivity = requestUrl.pathname === API_PATH
        const isVenue = requestUrl.pathname === VENUE_API_PATH
        const documentKey = resourceKey as ResourceDocumentKey | null
        const currentPath = isActivity
          ? dataPath
          : isVenue ? venuePath : path.join(dataDirectory, `${documentKey}.yaml`)
        const filename = isActivity ? "activities.yaml" : isVenue ? "venues.yaml" : `${documentKey}.yaml`
        if (!isLoopbackRequest(request)) {
          return sendJson(response, 403, { error: "编辑器仅允许从本机访问" })
        }

        try {
          if (request.method === "GET") {
            if (isActivity) {
              const snapshot = await readActivityDocuments(dataDirectory)
              return sendJson(response, 200, {
                activities: snapshot.activities, revision: snapshot.revision,
                modifiedAt: snapshot.modifiedAt, path: snapshot.path,
              })
            }
            const source = await readFile(currentPath, "utf8")
            const fileStat = await stat(currentPath)
            if (isVenue) {
              const { venues, value } = parseVenueDocument(source)
              return sendJson(response, 200, {
                venues,
                defaults: value.defaults,
                lastVerified: value.lastVerified,
                revision: revisionFor(source),
                modifiedAt: fileStat.mtime.toISOString(),
                path: "src/data/venues.yaml",
              })
            }
            const { activities } = parseListDocument(source)
            return sendJson(response, 200, {
              entries: activities,
              revision: revisionFor(source),
              modifiedAt: fileStat.mtime.toISOString(),
              path: `src/data/${filename}`,
              ...(documentKey === "activity-resources" ? {
                activityReferences: (await readActivityDocuments(dataDirectory)).activities.map(activityReference),
              } : {}),
            })
          }

          if (request.method === "PUT") {
            const payload = await readRequestBody(request)
            const entriesKey = isActivity ? "activities" : isVenue ? "venues" : "entries"
            if (!payload || typeof payload !== "object" ||
              !(entriesKey in payload) || !("revision" in payload)) {
              return sendJson(response, 400, { error: "保存请求格式无效" })
            }
            const entries = (payload as Record<string, unknown>)[entriesKey]
            const revision = payload.revision
            if (!Array.isArray(entries) || typeof revision !== "string") {
              return sendJson(response, 400, { error: "保存请求格式无效" })
            }

            if (isActivity) return await withFileWrite(dataPath, async () => {
              const snapshot = await readActivityDocuments(dataDirectory)
              if (snapshot.revision !== revision) {
                return sendJson(response, 409, { error: "活动主文件或子日程已被修改；当前输入已保留，请先处理差异" })
              }
              const venues = parseVenueDocument(await readFile(venuePath, "utf8")).venues
              const venueIds = new Set(venues.flatMap(venue =>
                venue && typeof venue === "object" && "id" in venue ? [String(venue.id)] : []))
              const issues = validateActivities(entries, venueIds)
              if (issues.some(issue => issue.severity === "error")) {
                return sendJson(response, 422, { error: "数据校验失败", issues })
              }
              const serialized = serializeActivityDocuments(snapshot, entries as Activity[])
              const verificationIssues = validateActivities(serialized.activities, venueIds)
              if (verificationIssues.some(issue => issue.severity === "error")) {
                return sendJson(response, 500, { error: "序列化后的 YAML 未通过校验", issues: verificationIssues })
              }
              await writeActivityDocuments(dataDirectory, snapshot, serialized.documents)
              const saved = await readActivityDocuments(dataDirectory)
              return sendJson(response, 200, { revision: saved.revision, modifiedAt: saved.modifiedAt, issues })
            })

            return await withFileWrite(currentPath, async () => {
              const activityIds = documentKey === "activity-resources"
                ? new Set((parseListDocument(await readFile(dataPath, "utf8")).activities as Array<{ id: string }>).map(item => item.id))
                : undefined
              const issues = isVenue ? validateVenues(entries) : validateResourceDocument(documentKey!, entries, activityIds)
              const errors = isVenue
                ? issues.filter((issue) => "severity" in issue && issue.severity === "error")
                : issues
              if (errors.length > 0) {
                return sendJson(response, 422, { error: "数据校验失败", issues })
              }

              const currentSource = await readFile(currentPath, "utf8")
              if (revisionFor(currentSource) !== revision) {
                return sendJson(response, 409, {
                  error: `${filename} 已被其他程序修改；当前输入已保留，请先处理差异`,
                })
              }

              const nextSource = isVenue
                ? updateVenueDocument(currentSource, entries)
                : updateListDocument(currentSource, entries)
              const verification = isVenue
                ? parseVenueDocument(nextSource).venues
                : parseListDocument(nextSource).activities
              const verificationIssues = isVenue ? validateVenues(verification) : validateResourceDocument(documentKey!, verification, activityIds)
              const verificationErrors = isVenue
                ? verificationIssues.filter((issue) => "severity" in issue && issue.severity === "error")
                : verificationIssues
              if (verificationErrors.length > 0) {
                return sendJson(response, 500, {
                  error: "序列化后的 YAML 未通过校验",
                  issues: verificationErrors,
                })
              }

              await replaceFile(currentPath, nextSource)
              return sendJson(response, 200, {
                revision: revisionFor(nextSource),
                modifiedAt: new Date().toISOString(),
                issues,
              })
            })
          }

          response.setHeader("Allow", "GET, PUT")
          return sendJson(response, 405, { error: "不支持的请求方法" })
        } catch (error) {
          const message = error instanceof Error ? error.message : "未知错误"
          return sendJson(response, 500, { error: message })
        }
      })
    },
  }
}
