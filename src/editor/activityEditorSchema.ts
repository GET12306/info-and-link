import { ACTIVITY_CATEGORY_ORDER } from "../config/activityCategories"

export type ActivityEditorScalarKey =
  | "id"
  | "category"
  | "scheduleLabel"
  | "link"
  | "startDate"
  | "endDate"
  | "durationMinutes"
  | "calendarExport"

export interface ActivityEditorField {
  key: ActivityEditorScalarKey
  label: string
  description?: string
  input: "text" | "url" | "number" | "checkbox" | "select"
  required?: boolean
  options?: readonly { value: string; label: string }[]
  placeholder?: string
}

export interface ActivityEditorSection {
  id: string
  title: string
  description: string
  fields: readonly ActivityEditorField[]
}

export const ACTIVITY_EDITOR_SECTIONS: readonly ActivityEditorSection[] = [
  {
    id: "identity",
    title: "基本信息",
    description: "ID 是页面跳转与日历 UID 使用的永久标识，创建后不应随标题或日期修改。",
    fields: [
      {
        key: "id",
        label: "id",
        input: "text",
        required: true,
        placeholder: "2026-example-event",
      },
      {
        key: "category",
        label: "category",
        input: "select",
        required: true,
        options: ACTIVITY_CATEGORY_ORDER.map((value) => ({ value, label: value })),
      },
      {
        key: "scheduleLabel",
        label: "scheduleLabel",
        input: "text",
        required: true,
        placeholder: "2026.09.12 / Weekly",
      },
      {
        key: "link",
        label: "link",
        input: "url",
        required: true,
        placeholder: "https://example.com/event",
      },
    ],
  },
  {
    id: "schedule",
    title: "状态与连续日期",
    description: "连续日期使用开始/结束日；非连续日期和精确时间请使用下方的场次编辑器。",
    fields: [
      { key: "startDate", label: "startDate", input: "text", placeholder: "YYYY-MM-DD" },
      { key: "endDate", label: "endDate", input: "text", placeholder: "YYYY-MM-DD" },
      {
        key: "durationMinutes",
        label: "durationMinutes",
        input: "number",
        description: "仅用于未单独填写结束时间的定时场次。",
      },
      {
        key: "calendarExport",
        label: "calendarExport",
        input: "select",
        options: [
          { value: "", label: "(omit) — auto behavior" },
          { value: "auto", label: "auto" },
          { value: "enabled", label: "enabled" },
          { value: "disabled", label: "disabled" },
        ],
      },
    ],
  },
] as const

export const ACTIVITY_EDITOR_KNOWN_FIELDS = new Set([
  "id",
  "category",
  "scheduleLabel",
  "startDate",
  "endDate",
  "recurrence",
  "durationMinutes",
  "calendarExport",
  "performances",
  "title",
  "venue",
  "description",
  "link",
  "ticketInfo",
])
