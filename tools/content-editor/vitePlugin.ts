import { createHash } from "node:crypto"
import { readFile, rename, stat, writeFile } from "node:fs/promises"
import path from "node:path"
import type { IncomingMessage, ServerResponse } from "node:http"
import type { Plugin } from "vite"
import { isSeq, parseDocument, Scalar, visit } from "yaml"
import { validateActivities } from "../../src/editor/activityValidation"
import { RESOURCE_DOCUMENT_KEYS, type ResourceDocumentKey } from "../../src/editor/resourceEditorSchema"
import { validateResourceDocument } from "../../src/editor/resourceValidation"

const API_PATH = "/__activity-editor/activities"
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

export function updateListDocument(source: string, nextActivities: unknown[]) {
  const { document, activities: currentActivities } = parseListDocument(source)
  if (!isSeq(document.contents)) throw new Error("YAML 的根节点必须是数组")
  const sequence = document.contents

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
      const dataPath = path.resolve(process.cwd(), "src/data/activities.yaml")
      const resourceKeys = new Set<string>(RESOURCE_DOCUMENT_KEYS)

      server.middlewares.use(async (request, response, next) => {
        const requestUrl = new URL(request.url ?? "/", "http://localhost")
        const resourceKey = requestUrl.pathname.startsWith(RESOURCE_API_PREFIX)
          ? requestUrl.pathname.slice(RESOURCE_API_PREFIX.length)
          : null
        if (requestUrl.pathname !== API_PATH && !resourceKeys.has(resourceKey ?? "")) return next()
        const isActivity = requestUrl.pathname === API_PATH
        const documentKey = resourceKey as ResourceDocumentKey | null
        const currentPath = isActivity
          ? dataPath
          : path.resolve(process.cwd(), "src/data", `${documentKey}.yaml`)
        const filename = isActivity ? "activities.yaml" : `${documentKey}.yaml`
        if (!isLoopbackRequest(request)) {
          return sendJson(response, 403, { error: "编辑器仅允许从本机访问" })
        }

        try {
          if (request.method === "GET") {
            const source = await readFile(currentPath, "utf8")
            const { activities } = parseListDocument(source)
            const fileStat = await stat(currentPath)
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
            const entriesKey = isActivity ? "activities" : "entries"
            if (!payload || typeof payload !== "object" ||
              !(entriesKey in payload) || !("revision" in payload)) {
              return sendJson(response, 400, { error: "保存请求格式无效" })
            }
            const activities = (payload as Record<string, unknown>)[entriesKey]
            const revision = payload.revision
            if (!Array.isArray(activities) || typeof revision !== "string") {
              return sendJson(response, 400, { error: "保存请求格式无效" })
            }

            const activityIds = !isActivity && documentKey === "activity-resources"
              ? new Set((parseListDocument(await readFile(dataPath, "utf8")).activities as Array<{ id: string }>).map(item => item.id))
              : undefined
            const issues = isActivity
              ? validateActivities(activities)
              : validateResourceDocument(documentKey!, activities, activityIds)
            const errors = isActivity
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

            const nextSource = updateListDocument(currentSource, activities)
            const verification = parseListDocument(nextSource).activities
            const verificationIssues = isActivity
              ? validateActivities(verification)
              : validateResourceDocument(documentKey!, verification, activityIds)
            const verificationErrors = isActivity
              ? verificationIssues.filter((issue) => "severity" in issue && issue.severity === "error")
              : verificationIssues
            if (verificationErrors.length > 0) {
              return sendJson(response, 500, {
                error: "序列化后的 YAML 未通过校验",
                issues: verificationErrors,
              })
            }

            const temporaryPath = path.join(
              path.dirname(currentPath),
              `.${path.basename(currentPath)}.${process.pid}.tmp`
            )
            await writeFile(temporaryPath, nextSource, "utf8")
            await rename(temporaryPath, currentPath)
            return sendJson(response, 200, {
              revision: revisionFor(nextSource),
              modifiedAt: new Date().toISOString(),
              issues,
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
