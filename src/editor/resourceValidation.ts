import { isRecord, isNonempty, isHttpUrl, isCalendarDate } from "../utils/contentValidation"
import { RESOURCE_EDITOR_DOCUMENTS, RESOURCE_LINK_FIELDS, type EditorField, type ResourceDocumentKey } from "./resourceEditorSchema"

export interface ResourceValidationIssue {
  path: string
  message: string
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
      for (const child of RESOURCE_LINK_FIELDS) {
        validateField(value[child.key], child, `${path}.${child.key}`, issues)
      }
    } else issues.push({ path, message: "链接必须是 URL 字符串或对象" })
    return
  }

  if (field.kind === "array") {
    if (!Array.isArray(value)) { issues.push({ path, message: "必须是列表" }); return }
    if (field.required && value.length === 0) issues.push({ path, message: "至少需要一项" })
    const urls = new Set<string>()
    value.forEach((item, index) => {
      if (field.item?.kind === "resourceLink") {
        const url = typeof item === "string" ? item : isRecord(item) ? item.url : undefined
        if (isNonempty(url)) {
          if (urls.has(url)) issues.push({ path: `${path}[${index}]`, message: "同一组中的链接不能重复" })
          urls.add(url)
        }
      }
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
    } else {
      for (const lang of ["ja", "en"]) {
        if (value[lang] !== undefined && typeof value[lang] !== "string") {
          issues.push({ path: `${path}.${lang}`, message: "翻译必须是文本" })
        }
      }
      if (!isNonempty(value.ja) && !isNonempty(value.en)) {
        issues.push({ path, message: "ja 和 en 至少填写一种" })
      }
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
  const uniqueIds = new Set<string>()

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
    if ((key === "magazines" || key === "daily-posts") && isNonempty(entry.id)) {
      if (uniqueIds.has(entry.id)) issues.push({ path: `${path}.id`, message: "id 不能重复" })
      uniqueIds.add(entry.id)
    }
  })
  return issues
}
