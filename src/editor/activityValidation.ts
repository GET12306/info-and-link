import { ACTIVITY_CATEGORY_ORDER } from "../config/activityCategories"

export interface ActivityValidationIssue {
  path: string
  message: string
  severity: "error" | "warning"
}

const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const DATE_TIME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/
const TIME_PATTERN = /^\d{2}:\d{2}$/
const CATEGORIES = new Set<string>(ACTIVITY_CATEGORY_ORDER)
const MILESTONE_KINDS = new Set(["update", "merch", "doors", "other"])
const WEEKDAYS = new Set([
  "sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday",
])
const WEEKDAY_INDEX = [
  "sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday",
]

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function isRealDate(value: unknown) {
  if (typeof value !== "string" || !DATE_PATTERN.test(value)) return false
  const [year, month, day] = value.split("-").map(Number)
  const parsed = new Date(Date.UTC(year, month - 1, day))
  return parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
}

function isRealDateTime(value: unknown) {
  if (typeof value !== "string" || !DATE_TIME_PATTERN.test(value)) return false
  return isRealDate(value.substring(0, 10)) &&
    Number(value.substring(11, 13)) < 24 &&
    Number(value.substring(14, 16)) < 60
}

function isRealDateOrDateTime(value: unknown) {
  return isRealDate(value) || isRealDateTime(value)
}

function normalizeBoundary(value: string, boundary: "start" | "end") {
  return DATE_PATTERN.test(value)
    ? `${value}T${boundary === "start" ? "00:00" : "23:59"}`
    : value
}

function isRealTime(value: unknown) {
  return typeof value === "string" && TIME_PATTERN.test(value) &&
    Number(value.substring(0, 2)) < 24 && Number(value.substring(3, 5)) < 60
}

function isHttpUrl(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return false
  try {
    const url = new URL(value)
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}

function validateLocalized(
  value: unknown,
  path: string,
  issues: ActivityValidationIssue[],
  required: boolean
) {
  if (value === undefined && !required) return
  if (!isRecord(value)) {
    issues.push({ path, message: "必须是包含 ja 和 en 的对象", severity: "error" })
    return
  }
  for (const language of ["ja", "en"] as const) {
    if (typeof value[language] !== "string" || !value[language].trim()) {
      issues.push({ path: `${path}.${language}`, message: `${language} 文本不能为空`, severity: "error" })
    }
  }
}

function validateOptionalDate(
  value: unknown,
  path: string,
  issues: ActivityValidationIssue[]
) {
  if (value !== undefined && !isRealDate(value)) {
    issues.push({ path, message: "日期必须是有效的 YYYY-MM-DD", severity: "error" })
  }
}

function validateOptionalDateTime(
  value: unknown,
  path: string,
  issues: ActivityValidationIssue[]
) {
  if (value !== undefined && !isRealDateTime(value)) {
    issues.push({ path, message: "时间必须是有效的 YYYY-MM-DDTHH:mm", severity: "error" })
  }
}

function validateMilestones(
  value: unknown,
  path: string,
  issues: ActivityValidationIssue[]
) {
  if (value === undefined) return
  if (!Array.isArray(value)) {
    issues.push({ path, message: "milestones 必须是数组", severity: "error" })
    return
  }
  value.forEach((milestone, index) => {
    const itemPath = `${path}[${index}]`
    if (!isRecord(milestone)) {
      issues.push({ path: itemPath, message: "节点必须是对象", severity: "error" })
      return
    }
    if (typeof milestone.kind !== "string" || !MILESTONE_KINDS.has(milestone.kind)) {
      issues.push({ path: `${itemPath}.kind`, message: "未知的节点类别", severity: "error" })
    }
    if (!isRealTime(milestone.at)) {
      issues.push({ path: `${itemPath}.at`, message: "时间必须是 HH:mm", severity: "error" })
    }
    if (milestone.until !== undefined && !isRealTime(milestone.until)) {
      issues.push({ path: `${itemPath}.until`, message: "结束时间必须是 HH:mm", severity: "error" })
    }
    if (typeof milestone.at === "string" && typeof milestone.until === "string" && milestone.until <= milestone.at) {
      issues.push({ path: `${itemPath}.until`, message: "结束时间必须晚于开始时间", severity: "error" })
    }
    validateLocalized(milestone.label, `${itemPath}.label`, issues, milestone.kind === "other")
  })
}

function validatePerformances(
  value: unknown,
  path: string,
  issues: ActivityValidationIssue[]
) {
  if (value === undefined) return
  if (!Array.isArray(value)) {
    issues.push({ path, message: "performances 必须是数组", severity: "error" })
    return
  }
  const identities = new Set<string>()
  value.forEach((performance, index) => {
    const itemPath = `${path}[${index}]`
    if (!isRecord(performance)) {
      issues.push({ path: itemPath, message: "场次必须是对象", severity: "error" })
      return
    }
    const hasDate = performance.occursOn !== undefined
    const hasTime = performance.startAt !== undefined
    if (hasDate === hasTime) {
      issues.push({ path: itemPath, message: "必须且只能填写 occursOn 或 startAt 之一", severity: "error" })
    }
    if (hasDate && !isRealDate(performance.occursOn)) {
      issues.push({ path: `${itemPath}.occursOn`, message: "日期必须是有效的 YYYY-MM-DD", severity: "error" })
    }
    if (hasTime && !isRealDateTime(performance.startAt)) {
      issues.push({ path: `${itemPath}.startAt`, message: "开演时间必须是有效的 YYYY-MM-DDTHH:mm", severity: "error" })
    }
    validateOptionalDateTime(performance.endAt, `${itemPath}.endAt`, issues)
    if (typeof performance.startAt === "string" && typeof performance.endAt === "string" && performance.endAt <= performance.startAt) {
      issues.push({ path: `${itemPath}.endAt`, message: "结束时间必须晚于开演时间", severity: "error" })
    }
    validateLocalized(performance.label, `${itemPath}.label`, issues, false)
    validateMilestones(performance.milestones, `${itemPath}.milestones`, issues)
    const identity = typeof performance.startAt === "string"
      ? performance.startAt
      : typeof performance.occursOn === "string"
        ? performance.occursOn
        : ""
    if (identity && identities.has(identity)) {
      issues.push({ path: itemPath, message: "活动中存在重复场次", severity: "error" })
    }
    identities.add(identity)
  })
}

function validateRecurrence(
  value: unknown,
  activity: Record<string, unknown>,
  path: string,
  issues: ActivityValidationIssue[]
) {
  if ("recurring" in activity) {
    issues.push({
      path: `${path}.recurring`,
      message: "recurring 已停用，请使用 recurrence.type: manual 或 weekly",
      severity: "error",
    })
  }
  if (value === undefined) return
  if (!isRecord(value) || (value.type !== "manual" && value.type !== "weekly")) {
    issues.push({ path: `${path}.recurrence`, message: "循环方式必须是 manual 或 weekly", severity: "error" })
    return
  }

  if (activity.startDate !== undefined || activity.endDate !== undefined) {
    issues.push({
      path: `${path}.recurrence`,
      message: "循环活动不能同时使用连续日期 startDate/endDate",
      severity: "error",
    })
  }

  if (value.type === "manual") {
    if (!Array.isArray(activity.performances) || activity.performances.length === 0) {
      issues.push({
        path: `${path}.performances`,
        message: "manual 循环活动至少需要一个手动场次",
        severity: "error",
      })
    }
    return
  }

  if (activity.performances !== undefined) {
    issues.push({
      path: `${path}.performances`,
      message: "weekly 循环活动由规则生成场次，请将例外写入 recurrence.overrides",
      severity: "error",
    })
  }
  if (!isRealDate(value.startOn)) {
    issues.push({ path: `${path}.recurrence.startOn`, message: "范围开始日必须是 YYYY-MM-DD", severity: "error" })
  }
  if (!isRealDate(value.endOn)) {
    issues.push({ path: `${path}.recurrence.endOn`, message: "范围结束日必须是 YYYY-MM-DD", severity: "error" })
  }
  if (typeof value.startOn === "string" && typeof value.endOn === "string" &&
      isRealDate(value.startOn) && isRealDate(value.endOn) && value.endOn < value.startOn) {
    issues.push({ path: `${path}.recurrence.endOn`, message: "范围结束日不能早于开始日", severity: "error" })
  }
  if (typeof value.weekday !== "string" || !WEEKDAYS.has(value.weekday)) {
    issues.push({ path: `${path}.recurrence.weekday`, message: "请选择有效星期", severity: "error" })
  }
  if (!isRealTime(value.startTime)) {
    issues.push({ path: `${path}.recurrence.startTime`, message: "默认时间必须是 HH:mm", severity: "error" })
  }
  if (value.overrides === undefined) return
  if (!Array.isArray(value.overrides)) {
    issues.push({ path: `${path}.recurrence.overrides`, message: "overrides 必须是数组", severity: "error" })
    return
  }

  const overrideDates = new Set<string>()
  value.overrides.forEach((override, index) => {
    const itemPath = `${path}.recurrence.overrides[${index}]`
    if (!isRecord(override)) {
      issues.push({ path: itemPath, message: "覆盖项必须是对象", severity: "error" })
      return
    }
    const overrideDate = typeof override.date === "string" ? override.date : ""
    if (!isRealDate(overrideDate)) {
      issues.push({ path: `${itemPath}.date`, message: "覆盖日期必须是 YYYY-MM-DD", severity: "error" })
    } else {
      if (overrideDates.has(overrideDate)) {
        issues.push({ path: `${itemPath}.date`, message: "同一日期只能覆盖一次", severity: "error" })
      }
      overrideDates.add(overrideDate)
      if (typeof value.startOn === "string" && typeof value.endOn === "string" &&
          (overrideDate < value.startOn || overrideDate > value.endOn)) {
        issues.push({ path: `${itemPath}.date`, message: "覆盖日期必须位于生成范围内", severity: "error" })
      }
      if (typeof value.weekday === "string" && WEEKDAYS.has(value.weekday)) {
        const weekday = WEEKDAY_INDEX[new Date(`${overrideDate}T12:00:00Z`).getUTCDay()]
        if (weekday !== value.weekday) {
          issues.push({ path: `${itemPath}.date`, message: "覆盖日期必须是规则生成的星期", severity: "error" })
        }
      }
    }
    if (override.startTime !== undefined && !isRealTime(override.startTime)) {
      issues.push({ path: `${itemPath}.startTime`, message: "覆盖时间必须是 HH:mm", severity: "error" })
    }
    if (override.cancelled !== undefined && typeof override.cancelled !== "boolean") {
      issues.push({ path: `${itemPath}.cancelled`, message: "cancelled 必须是布尔值", severity: "error" })
    }
    if (override.cancelled === true && override.startTime !== undefined) {
      issues.push({ path: itemPath, message: "取消的场次不能同时覆盖时间", severity: "error" })
    }
  })
}

function validateTicketInfo(
  value: unknown,
  path: string,
  issues: ActivityValidationIssue[]
) {
  if (value === undefined) return
  if (!isRecord(value)) {
    issues.push({ path, message: "ticketInfo 必须是对象", severity: "error" })
    return
  }
  if (value.link !== undefined && !isHttpUrl(value.link)) {
    issues.push({ path: `${path}.link`, message: "票务链接必须是 HTTP(S) URL", severity: "error" })
  }
  validateLocalized(value.price, `${path}.price`, issues, false)
  if (!Array.isArray(value.entries) || value.entries.length === 0) {
    issues.push({ path: `${path}.entries`, message: "票务信息至少需要一个条目", severity: "error" })
    return
  }
  value.entries.forEach((entry, index) => {
    const itemPath = `${path}.entries[${index}]`
    if (!isRecord(entry)) {
      issues.push({ path: itemPath, message: "票务条目必须是对象", severity: "error" })
      return
    }
    validateLocalized(entry.type, `${itemPath}.type`, issues, true)
    if (typeof entry.scheduleLabel !== "string" || !entry.scheduleLabel.trim()) {
      issues.push({ path: `${itemPath}.scheduleLabel`, message: "显示日程不能为空", severity: "error" })
    }
    if ("startDate" in entry || "endDate" in entry) {
      issues.push({
        path: itemPath,
        message: "startDate/endDate 已停用，请将日期写入 startAt/endAt",
        severity: "error",
      })
    }
    if (entry.startAt !== undefined && !isRealDateOrDateTime(entry.startAt)) {
      issues.push({ path: `${itemPath}.startAt`, message: "开始时间必须是 YYYY-MM-DD 或 YYYY-MM-DDTHH:mm", severity: "error" })
    }
    if (entry.endAt !== undefined && !isRealDateOrDateTime(entry.endAt)) {
      issues.push({ path: `${itemPath}.endAt`, message: "截止时间必须是 YYYY-MM-DD 或 YYYY-MM-DDTHH:mm", severity: "error" })
    }
    if (
      typeof entry.startAt === "string" && isRealDateOrDateTime(entry.startAt) &&
      typeof entry.endAt === "string" && isRealDateOrDateTime(entry.endAt) &&
      normalizeBoundary(entry.endAt, "end") <= normalizeBoundary(entry.startAt, "start")
    ) {
      issues.push({ path: `${itemPath}.endAt`, message: "截止时间必须晚于开始时间", severity: "error" })
    }
    if (entry.link !== undefined && !isHttpUrl(entry.link)) {
      issues.push({ path: `${itemPath}.link`, message: "条目链接必须是 HTTP(S) URL", severity: "error" })
    }
    validateLocalized(entry.price, `${itemPath}.price`, issues, false)
    validateLocalized(entry.description, `${itemPath}.description`, issues, false)
  })
}

export function validateActivities(value: unknown): ActivityValidationIssue[] {
  const issues: ActivityValidationIssue[] = []
  if (!Array.isArray(value)) {
    return [{ path: "activities", message: "YAML 根节点必须是活动数组", severity: "error" }]
  }
  const ids = new Set<string>()
  value.forEach((activity, index) => {
    const path = `activities[${index}]`
    if (!isRecord(activity)) {
      issues.push({ path, message: "活动必须是对象", severity: "error" })
      return
    }
    if (typeof activity.id !== "string" || !ID_PATTERN.test(activity.id)) {
      issues.push({ path: `${path}.id`, message: "ID 只能使用小写字母、数字和单个连字符", severity: "error" })
    } else if (ids.has(activity.id)) {
      issues.push({ path: `${path}.id`, message: `ID ${activity.id} 重复`, severity: "error" })
    } else {
      ids.add(activity.id)
    }
    if (typeof activity.category !== "string" || !CATEGORIES.has(activity.category)) {
      issues.push({ path: `${path}.category`, message: "未知的活动类别", severity: "error" })
    }
    if (typeof activity.scheduleLabel !== "string" || !activity.scheduleLabel.trim()) {
      issues.push({ path: `${path}.scheduleLabel`, message: "显示日程不能为空", severity: "error" })
    }
    validateLocalized(activity.title, `${path}.title`, issues, true)
    if (activity.venueIds !== undefined) {
      if (!Array.isArray(activity.venueIds) || activity.venueIds.length === 0) {
        issues.push({ path: `${path}.venueIds`, message: "场馆 ID 必须是非空数组", severity: "error" })
      } else {
        const seenVenueIds = new Set<string>()
        activity.venueIds.forEach((venueId, venueIndex) => {
          const venuePath = `${path}.venueIds[${venueIndex}]`
          if (typeof venueId !== "string" || !ID_PATTERN.test(venueId)) {
            issues.push({ path: venuePath, message: `场馆 ID 格式无效：${String(venueId)}`, severity: "error" })
          } else if (seenVenueIds.has(venueId)) {
            issues.push({ path: venuePath, message: "同一活动不能重复引用场馆", severity: "error" })
          }
          seenVenueIds.add(String(venueId))
        })
      }
    }
    validateLocalized(activity.venueNote, `${path}.venueNote`, issues, false)
    validateLocalized(activity.description, `${path}.description`, issues, false)
    if (!isHttpUrl(activity.link)) {
      issues.push({ path: `${path}.link`, message: "活动链接必须是 HTTP(S) URL", severity: "error" })
    }
    validateOptionalDate(activity.startDate, `${path}.startDate`, issues)
    validateOptionalDate(activity.endDate, `${path}.endDate`, issues)
    if (typeof activity.startDate === "string" && typeof activity.endDate === "string" && activity.endDate < activity.startDate) {
      issues.push({ path: `${path}.endDate`, message: "结束日期不能早于开始日期", severity: "error" })
    }
    if (activity.durationMinutes !== undefined &&
      (typeof activity.durationMinutes !== "number" || !Number.isFinite(activity.durationMinutes) || activity.durationMinutes <= 0)) {
      issues.push({ path: `${path}.durationMinutes`, message: "统一时长必须是正数", severity: "error" })
    }
    if (activity.calendarExport !== undefined && !["auto", "enabled", "disabled"].includes(String(activity.calendarExport))) {
      issues.push({ path: `${path}.calendarExport`, message: "日历导出值无效", severity: "error" })
    }
    validatePerformances(activity.performances, `${path}.performances`, issues)
    validateRecurrence(activity.recurrence, activity, path, issues)
    validateTicketInfo(activity.ticketInfo, `${path}.ticketInfo`, issues)
    if (activity.recurrence === undefined && activity.startDate === undefined && !Array.isArray(activity.performances)) {
      issues.push({ path, message: "没有机器可读日期，活动不会进入状态和日历计算", severity: "warning" })
    }
  })
  return issues
}
