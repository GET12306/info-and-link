import { createHash } from "node:crypto"
import { readFile, stat } from "node:fs/promises"
import path from "node:path"
import type { IncomingMessage, ServerResponse } from "node:http"
import type { Plugin } from "vite"
import { isMap, isSeq, parseDocument, Scalar, visit, type Document, type YAMLSeq } from "yaml"
import { validateActivities } from "../../src/editor/activityValidation"
import { RESOURCE_DOCUMENT_KEYS, type ResourceDocumentKey } from "../../src/editor/resourceEditorSchema"
import { validateResourceDocument } from "../../src/editor/resourceValidation"
import { validateVenues } from "../../src/editor/venueValidation"

import { replaceFile, withFileWrite } from "./fileWrites"

const API_PATH = "/__activity-editor/activities"
const VENUE_API_PATH = "/__activity-editor/venues"
const RESOURCE_API_PREFIX = "/__activity-editor/data/"
const MAX_REQUEST_BYTES = 2 * 1024 * 1024

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

export function parseListDocument(source: string) {
  const document = parseDocument(source)
  if (document.errors.length > 0) {
    throw new Error(document.errors.map((error) => error.message).join("\n"))
  }
  const activities = document.toJS() as unknown
  if (!Array.isArray(activities) || !isSeq(document.contents)) {
    throw new Error("YAML 的根节点必须是数组")
  }
  return { document, activities }
}

function updateSequence(
  document: Document.Parsed,
  sequence: YAMLSeq<unknown>,
  currentActivities: unknown[],
  nextActivities: unknown[]
) {
  const currentById = new Map<string, { data: unknown; node: unknown }>()
  currentActivities.forEach((activity, index) => {
    if (activity && typeof activity === "object" && "id" in activity) {
      currentById.set(String(activity.id), {
        data: activity,
        node: sequence.items[index],
      })
    }
  })

  const usedNodes = new Set<unknown>()
  sequence.items = nextActivities.map((activity, index) => {
    const id = activity && typeof activity === "object" && "id" in activity
      ? String(activity.id)
      : ""
    const existing = currentById.get(id)
    const matchingIndex = currentActivities.findIndex((current, currentIndex) =>
      !usedNodes.has(sequence.items[currentIndex]) && JSON.stringify(current) === JSON.stringify(activity)
    )
    if (matchingIndex >= 0) {
      const matchingNode = sequence.items[matchingIndex]
      usedNodes.add(matchingNode)
      return matchingNode
    }
    if (existing && JSON.stringify(existing.data) === JSON.stringify(activity)) {
      usedNodes.add(existing.node)
      return existing.node as never
    }

    const fallbackNode = existing?.node ?? sequence.items[index]
    const nextNode = document.createNode(activity)
    visit(nextNode, {
      Scalar(key, node) {
        if (key !== "key" && typeof node.value === "string") {
          node.type = Scalar.QUOTE_DOUBLE
        }
      },
    })
    if (fallbackNode && !usedNodes.has(fallbackNode)) {
      const previous = fallbackNode as {
        comment?: string | null
        commentBefore?: string | null
        spaceBefore?: boolean
      }
      const replacement = nextNode as typeof previous
      replacement.comment = previous.comment
      replacement.commentBefore = previous.commentBefore
      replacement.spaceBefore = previous.spaceBefore
      usedNodes.add(fallbackNode)
    }
    return nextNode as never
  })
}

export function updateListDocument(source: string, nextActivities: unknown[]) {
  const { document, activities: currentActivities } = parseListDocument(source)
  if (!isSeq(document.contents)) throw new Error("YAML 的根节点必须是数组")
  updateSequence(document, document.contents, currentActivities, nextActivities)

  return document.toString({ lineWidth: 0 })
}

export function parseVenueDocument(source: string) {
  const document = parseDocument(source)
  if (document.errors.length > 0) {
    throw new Error(document.errors.map((error) => error.message).join("\n"))
  }
  const value = document.toJS() as unknown
  const venueNode = document.get("venues", true)
  if (!value || typeof value !== "object" || Array.isArray(value) ||
      !Array.isArray((value as { venues?: unknown }).venues) ||
      !isMap(document.contents) || !isSeq(venueNode)) {
    throw new Error("venues.yaml 必须是包含 venues 数组的对象")
  }
  return {
    document,
    value: value as Record<string, unknown>,
    venues: (value as { venues: unknown[] }).venues,
    venueNode,
  }
}

export function updateVenueDocument(source: string, nextVenues: unknown[]) {
  const { document, venues: currentVenues, venueNode } = parseVenueDocument(source)
  updateSequence(document, venueNode, currentVenues, nextVenues)
  return document.toString({ lineWidth: 0 })
}

export const parseActivityDocument = parseListDocument
export const updateActivityDocument = updateListDocument

export function activityEditorPlugin(enabled: boolean): Plugin {
  return {
    name: "local-activity-editor",
    apply: "serve",
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
              [isActivity ? "activities" : "entries"]: activities,
              revision: revisionFor(source),
              modifiedAt: fileStat.mtime.toISOString(),
              path: `src/data/${filename}`,
              ...(!isActivity && documentKey === "activity-resources" ? {
                activityIds: (parseListDocument(await readFile(dataPath, "utf8")).activities as Array<{ id: string }>).map(item => item.id),
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

            return await withFileWrite(currentPath, async () => {
              const activityIds = !isActivity && documentKey === "activity-resources"
                ? new Set((parseListDocument(await readFile(dataPath, "utf8")).activities as Array<{ id: string }>).map(item => item.id))
                : undefined
              const venueDocument = isActivity
                ? parseVenueDocument(await readFile(venuePath, "utf8"))
                : undefined
              const venueIds = venueDocument
                ? new Set(venueDocument.venues.flatMap(venue =>
                  venue && typeof venue === "object" && "id" in venue ? [String(venue.id)] : []))
                : undefined
              const issues = isActivity
                ? validateActivities(entries, venueIds)
                : isVenue ? validateVenues(entries) : validateResourceDocument(documentKey!, entries, activityIds)
              const errors = isActivity || isVenue
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
              const verificationIssues = isActivity
                ? validateActivities(verification, venueIds)
                : isVenue ? validateVenues(verification) : validateResourceDocument(documentKey!, verification, activityIds)
              const verificationErrors = isActivity || isVenue
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
