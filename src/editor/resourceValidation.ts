import { RESOURCE_EDITOR_DOCUMENTS, type EditorField, type ResourceDocumentKey } from "./resourceEditorSchema"

export interface ResourceValidationIssue {
  path: string
  message: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}

function isNonempty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === "https:" || url.protocol === "http:"
  } catch { return false }
}

function isCalendarDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

function validateField(value: unknown, field: EditorField, path: string, issues: ResourceValidationIssue[]) {
  if (value === undefined || value === null) {
    if (field.required) issues.push({ path, message: "必填字段缺失" })
    return
  }

  if (field.kind === "resourceTarget") {
    if (!isRecord(value)) { issues.push({ path, message: "资源链接结构无效" }); return }
    const hasUrl = value.url !== undefined
    const hasLinks = value.links !== undefined
    if (hasUrl === hasLinks) {
      issues.push({ path, message: "url 与 links 必须且只能填写一种" })
    }
    if (hasUrl) validateField(value.url, { key: "url", kind: "url", required: true }, `${path}.url`, issues)
    if (hasLinks) validateField(value.links, {
      key: "links", kind: "array", required: true,
      item: { key: "links[]", kind: "resourceLink" },
    }, `${path}.links`, issues)
    return
  }

  if (field.kind === "resourceLink") {
    if (typeof value === "string") {
      if (!isHttpUrl(value)) issues.push({ path, message: "链接必须是完整的 http(s) URL" })
    } else if (isRecord(value)) {
      validateField(value.url, { key: "url", kind: "url", required: true }, `${path}.url`, issues)
      if (value.date !== undefined) validateField(value.date, { key: "date", kind: "text", format: "date" }, `${path}.date`, issues)
      if (value.label !== undefined) validateField(value.label, { key: "label", kind: "archiveText" }, `${path}.label`, issues)
      if (value.platform !== undefined) validateField(value.platform, { key: "platform", kind: "select", options: ["x", "instagram", "youtube", "web", "other"] }, `${path}.platform`, issues)
      if (value.status !== undefined) validateField(value.status, { key: "status", kind: "select", options: ["available", "expired"] }, `${path}.status`, issues)
    } else issues.push({ path, message: "链接必须是 URL 字符串或对象" })
    return
  }

  if (field.kind === "array") {
    if (!Array.isArray(value)) { issues.push({ path, message: "必须是列表" }); return }
    if (field.required && value.length === 0) issues.push({ path, message: "至少需要一项" })
    value.forEach((item, index) => {
      if (field.item) validateField(item, field.item, `${path}[${index}]`, issues)
    })
    return
  }

  if (field.kind === "object") {
    if (!isRecord(value)) { issues.push({ path, message: "必须是对象" }); return }
    for (const child of field.fields ?? []) {
      validateField(child.kind === "resourceTarget" ? value : value[child.key], child,
        child.kind === "resourceTarget" ? path : `${path}.${child.key}`, issues)
    }
    return
  }

  if (field.kind === "localized" || field.kind === "archiveText") {
    if (field.kind === "archiveText" && isNonempty(value)) return
    if (!isRecord(value)) { issues.push({ path, message: "需要填写文本或 ja/en 对象" }); return }
    if (field.kind === "localized") {
      for (const lang of ["ja", "en"]) {
        if (!isNonempty(value[lang])) issues.push({ path: `${path}.${lang}`, message: "需要填写文本" })
      }
    } else if (!isNonempty(value.ja) && !isNonempty(value.en)) {
      issues.push({ path, message: "ja 和 en 至少填写一种" })
    }
    return
  }

  if (!isNonempty(value)) { issues.push({ path, message: "需要填写文本" }); return }
  if (field.kind === "url" && !isHttpUrl(value)) {
    issues.push({ path, message: "链接必须是完整的 http(s) URL" })
  }
  if (field.kind === "select" && !field.options?.includes(value)) {
    issues.push({ path, message: "请选择有效选项" })
  }
  if (field.format === "date" && !isCalendarDate(value)) {
    issues.push({ path, message: "日期须为有效的 YYYY-MM-DD" })
  }
  if (field.format === "publicationDate" && !(/^\d{4}$/.test(value) ||
    /^\d{4}-(0[1-9]|1[0-2])$/.test(value) || isCalendarDate(value))) {
    issues.push({ path, message: "日期须为 YYYY、YYYY-MM 或 YYYY-MM-DD" })
  }
}

export function validateResourceDocument(
  key: ResourceDocumentKey,
  value: unknown,
  activityIds?: ReadonlySet<string>
): ResourceValidationIssue[] {
  const issues: ResourceValidationIssue[] = []
  if (!Array.isArray(value)) return [{ path: key, message: "顶层必须是列表" }]
  const schema = RESOURCE_EDITOR_DOCUMENTS[key]
  const magazineIds = new Set<string>()

  value.forEach((entry, index) => {
    const path = `${key}[${index}]`
    if (!isRecord(entry)) { issues.push({ path, message: "每项必须是对象" }); return }
    for (const field of schema.fields) {
      validateField(field.kind === "resourceTarget" ? entry : entry[field.key], field,
        field.kind === "resourceTarget" ? path : `${path}.${field.key}`, issues)
    }
    if (key === "activity-resources" && activityIds && isNonempty(entry.activityId) && !activityIds.has(entry.activityId)) {
      issues.push({ path: `${path}.activityId`, message: "activities.yaml 中找不到这个 id" })
    }
    if (key === "magazines" && isNonempty(entry.id)) {
      if (magazineIds.has(entry.id)) issues.push({ path: `${path}.id`, message: "id 不能重复" })
      magazineIds.add(entry.id)
    }
  })
  return issues
}
