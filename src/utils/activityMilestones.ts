import { TRANSLATIONS } from "../i18n"
import type {
  ActivityMilestone,
  ActivityMilestoneKind,
  Language,
} from "../types"

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/
const MILESTONE_KINDS = new Set<ActivityMilestoneKind>([
  "update",
  "merch",
  "doors",
  "other",
])

function hasLocalizedLabel(milestone: ActivityMilestone) {
  return Boolean(milestone.label?.ja?.trim() && milestone.label?.en?.trim())
}

export function isValidActivityMilestone(
  value: unknown
): value is ActivityMilestone {
  if (!value || typeof value !== "object") return false
  const milestone = value as ActivityMilestone
  if (!MILESTONE_KINDS.has(milestone.kind)) return false
  if (typeof milestone.at !== "string" || !TIME_PATTERN.test(milestone.at)) {
    return false
  }
  if (
    milestone.until !== undefined &&
    (typeof milestone.until !== "string" ||
      !TIME_PATTERN.test(milestone.until) ||
      milestone.until <= milestone.at)
  ) {
    return false
  }
  if (milestone.label !== undefined && !hasLocalizedLabel(milestone)) {
    return false
  }
  return milestone.kind !== "other" || hasLocalizedLabel(milestone)
}

export function getValidActivityMilestones(value: unknown) {
  if (!Array.isArray(value)) return []
  return value.filter(isValidActivityMilestone).sort((a, b) =>
    a.at.localeCompare(b.at)
  )
}

export function getActivityMilestoneLabel(
  milestone: ActivityMilestone,
  lang: Language
) {
  if (milestone.label?.[lang]?.trim()) return milestone.label[lang].trim()
  const t = TRANSLATIONS[lang]
  if (milestone.kind === "update") return t.milestone_update
  if (milestone.kind === "merch") return t.milestone_merch
  if (milestone.kind === "doors") return t.milestone_doors
  return t.milestone_other
}

export function getActivityMilestoneTime(milestone: ActivityMilestone) {
  return milestone.until
    ? `${milestone.at}–${milestone.until}`
    : milestone.at
}

export function formatActivityMilestone(
  milestone: ActivityMilestone,
  lang: Language
) {
  return `${getActivityMilestoneLabel(milestone, lang)} ${getActivityMilestoneTime(
    milestone
  )}`
}
