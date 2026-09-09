import { createHash } from "node:crypto"
import { readFile, rename, stat, writeFile } from "node:fs/promises"
import path from "node:path"
import type { IncomingMessage, ServerResponse } from "node:http"
import type { Plugin } from "vite"
import { isSeq, parseDocument, Scalar, visit } from "yaml"
import { validateActivities } from "../../src/editor/activityValidation"

const API_PATH = "/__activity-editor/activities"
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

export function parseActivityDocument(source: string) {
  const document = parseDocument(source)
  if (document.errors.length > 0) {
    throw new Error(document.errors.map((error) => error.message).join("\n"))
  }
  const activities = document.toJS() as unknown
  if (!Array.isArray(activities) || !isSeq(document.contents)) {
    throw new Error("activities.yaml 的根节点必须是数组")
  }
  return { document, activities }
}

export function updateActivityDocument(source: string, nextActivities: unknown[]) {
  const { document, activities: currentActivities } = parseActivityDocument(source)
  if (!isSeq(document.contents)) throw new Error("activities.yaml 的根节点必须是数组")
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

export function activityEditorPlugin(enabled: boolean): Plugin {
  return {
    name: "local-activity-editor",
    apply: "serve",
    configureServer(server) {
      if (!enabled) return
      const dataPath = path.resolve(process.cwd(), "src/data/activities.yaml")

      server.middlewares.use(async (request, response, next) => {
        const requestUrl = new URL(request.url ?? "/", "http://localhost")
        if (requestUrl.pathname !== API_PATH) return next()
        if (!isLoopbackRequest(request)) {
          return sendJson(response, 403, { error: "编辑器仅允许从本机访问" })
        }

        try {
          if (request.method === "GET") {
            const source = await readFile(dataPath, "utf8")
            const { activities } = parseActivityDocument(source)
            const fileStat = await stat(dataPath)
            return sendJson(response, 200, {
              activities,
              revision: revisionFor(source),
              modifiedAt: fileStat.mtime.toISOString(),
              path: "src/data/activities.yaml",
            })
          }

          if (request.method === "PUT") {
            const payload = await readRequestBody(request)
            if (!payload || typeof payload !== "object" ||
              !("activities" in payload) || !("revision" in payload)) {
              return sendJson(response, 400, { error: "保存请求格式无效" })
            }
            const activities = payload.activities
            const revision = payload.revision
            if (!Array.isArray(activities) || typeof revision !== "string") {
              return sendJson(response, 400, { error: "保存请求格式无效" })
            }

            const issues = validateActivities(activities)
            const errors = issues.filter((issue) => issue.severity === "error")
            if (errors.length > 0) {
              return sendJson(response, 422, { error: "数据校验失败", issues })
            }

            const currentSource = await readFile(dataPath, "utf8")
            if (revisionFor(currentSource) !== revision) {
              return sendJson(response, 409, {
                error: "activities.yaml 已被其他程序修改，请重新载入后再保存",
              })
            }

            const nextSource = updateActivityDocument(currentSource, activities)
            const verification = parseActivityDocument(nextSource).activities
            const verificationErrors = validateActivities(verification).filter(
              (issue) => issue.severity === "error"
            )
            if (verificationErrors.length > 0) {
              return sendJson(response, 500, {
                error: "序列化后的 YAML 未通过校验",
                issues: verificationErrors,
              })
            }

            const temporaryPath = path.join(
              path.dirname(dataPath),
              `.${path.basename(dataPath)}.${process.pid}.tmp`
            )
            await writeFile(temporaryPath, nextSource, "utf8")
            await rename(temporaryPath, dataPath)
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
