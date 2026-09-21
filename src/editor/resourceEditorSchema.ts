export const RESOURCE_DOCUMENT_KEYS = ["activity-resources", "magazines", "notes", "programs"] as const
export type ResourceDocumentKey = typeof RESOURCE_DOCUMENT_KEYS[number]

export interface EditorField {
  key: string
  kind: "text" | "url" | "select" | "localized" | "archiveText" | "object" | "array" | "resourceTarget" | "resourceLink"
  required?: boolean
  multiline?: boolean
  format?: "date" | "publicationDate"
  placeholder?: string
  options?: readonly string[]
  fields?: readonly EditorField[]
  item?: EditorField
}

const STATUS = ["available", "expired"] as const
const KINDS = ["announcement", "merchandise", "post", "photo", "video", "report", "other"] as const
const PLATFORMS = ["x", "instagram", "youtube", "web", "other"] as const

const resourceTarget: EditorField = { key: "target", kind: "resourceTarget", required: true }
const relatedResourceFields: readonly EditorField[] = [
  { key: "date", kind: "text", format: "date", placeholder: "YYYY-MM-DD" },
  { key: "kind", kind: "select", required: true, options: KINDS },
  { key: "platform", kind: "select", required: true, options: PLATFORMS },
  { key: "title", kind: "archiveText", required: true },
  { key: "description", kind: "archiveText", multiline: true },
  { key: "status", kind: "select", options: STATUS },
  resourceTarget,
]

const relatedResources: EditorField = {
  key: "relatedResources", kind: "array",
  item: { key: "relatedResources[]", kind: "object", fields: relatedResourceFields },
}

export const RESOURCE_EDITOR_DOCUMENTS: Record<ResourceDocumentKey, {
  label: string
  filename: string
  description: string
  fields: readonly EditorField[]
  create: () => Record<string, unknown>
}> = {
  "activity-resources": {
    label: "Activity Resources",
    filename: "activity-resources.yaml",
    description: "与活动 ID 关联的官方告知、返图、视频和其他链接。",
    fields: [
      { key: "activityId", kind: "text", required: true, placeholder: "activities.yaml 中的 id" },
      { key: "date", kind: "text", required: true, format: "date", placeholder: "YYYY-MM-DD" },
      { key: "kind", kind: "select", required: true, options: KINDS },
      { key: "platform", kind: "select", required: true, options: PLATFORMS },
      { key: "title", kind: "localized", required: true },
      { key: "description", kind: "localized", multiline: true },
      { key: "status", kind: "select", options: STATUS },
      resourceTarget,
    ],
    create: () => ({ activityId: "", date: "", kind: "post", platform: "x", title: { ja: "", en: "" }, url: "" }),
  },
  magazines: {
    label: "Magazines",
    filename: "magazines.yaml",
    description: "杂志的出版信息、封面、链接与相关资料。",
    fields: [
      { key: "title", kind: "archiveText", required: true },
      { key: "id", kind: "text" },
      { key: "issue", kind: "archiveText" },
      { key: "publicationDate", kind: "text", format: "publicationDate", placeholder: "YYYY / YYYY-MM / YYYY-MM-DD" },
      { key: "publisher", kind: "archiveText" },
      { key: "feature", kind: "archiveText", multiline: true },
      { key: "pages", kind: "archiveText" },
      { key: "isbn", kind: "archiveText" },
      { key: "notes", kind: "archiveText", multiline: true },
      { key: "cover", kind: "object", fields: [
        { key: "url", kind: "url", required: true },
        { key: "alt", kind: "archiveText" },
        { key: "sourceUrl", kind: "url" },
      ] },
      { key: "links", kind: "array", item: { key: "links[]", kind: "object", fields: [
        { key: "url", kind: "url", required: true },
        { key: "label", kind: "archiveText" },
        { key: "status", kind: "select", options: STATUS },
      ] } },
      relatedResources,
    ],
    create: () => ({ title: { ja: "", en: "" } }),
  },
  notes: {
    label: "Notes",
    filename: "notes.yaml",
    description: "文章与采访，以及相关链接和补充资料。",
    fields: [
      { key: "title", kind: "localized", required: true },
      { key: "date", kind: "text", format: "date", placeholder: "YYYY-MM-DD" },
      { key: "category", kind: "localized" },
      { key: "description", kind: "localized", multiline: true },
      { key: "link", kind: "url" },
      { key: "status", kind: "select", options: STATUS },
      { key: "relatedLinks", kind: "array", item: { key: "relatedLinks[]", kind: "object", fields: [
        { key: "url", kind: "url", required: true },
        { key: "title", kind: "localized" },
        { key: "type", kind: "localized" },
        { key: "status", kind: "select", options: STATUS },
      ] } },
      relatedResources,
    ],
    create: () => ({ title: { ja: "", en: "" } }),
  },
  programs: {
    label: "Programs",
    filename: "programs.yaml",
    description: "节目与企划档案；具体场次仍在 Activities 中编辑。",
    fields: [
      { key: "date", kind: "text", required: true, placeholder: "页面显示的时期文字" },
      { key: "title", kind: "localized", required: true },
      { key: "description", kind: "localized", multiline: true },
      { key: "url", kind: "url" },
      { key: "status", kind: "select", required: true, options: STATUS },
      relatedResources,
    ],
    create: () => ({ date: "", title: { ja: "", en: "" }, status: "available" }),
  },
}
