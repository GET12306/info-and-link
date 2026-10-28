import type { Activity, ActivityPerformance, MonthlyActivityRecurrence } from "../types"
import { isCalendarDate, isClockTime, isRecord } from "./contentValidation"
import { dateTimeInZone, instantFromSourceKey, sourceTimeZone } from "./timeZone"

const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]

export function monthlyDate(month: string, weekday: string, week: number) {
  const [year, number] = month.split("-").map(Number)
  const first = new Date(Date.UTC(year, number - 1, 1))
  const day = 1 + (WEEKDAYS.indexOf(weekday) - first.getUTCDay() + 7) % 7 + (week - 1) * 7
  const date = new Date(Date.UTC(year, number - 1, day))
  return date.getUTCMonth() === number - 1 ? date.toISOString().slice(0, 10) : null
}

/** Shared by validation and generation, so malformed rules cannot silently create schedules. */
export function monthlyRuleIssues(value: unknown): Array<{ path: string; message: string }> {
  if (!isRecord(value)) return [{ path: "", message: "月更规则必须是对象" }]
  const issues: Array<{ path: string; message: string }> = []
  const add = (path: string, message: string) => issues.push({ path, message })
  if (!isCalendarDate(value.startOn)) add("startOn", "开始日必须是有效的 YYYY-MM-DD")
  if (!WEEKDAYS.includes(String(value.weekday))) add("weekday", "请选择有效星期")
  if (!Number.isInteger(value.weekOfMonth) || Number(value.weekOfMonth) < 1 || Number(value.weekOfMonth) > 5) add("weekOfMonth", "每月第几次必须为 1～5")
  if (value.updateTime !== undefined && !isClockTime(value.updateTime)) add("updateTime", "更新时间必须是 HH:mm")
  if (value.firstEpisode !== undefined && (!Number.isInteger(value.firstEpisode) || Number(value.firstEpisode) < 1)) add("firstEpisode", "起始回数必须为正整数")
  if (value.overrides === undefined) return issues
  if (!Array.isArray(value.overrides)) return [...issues, { path: "overrides", message: "例外必须是数组" }]
  const validRule = issues.length === 0
  const dates = new Set<string>()
  value.overrides.forEach((override, index) => {
    const prefix = "overrides[" + index + "]"
    if (!isRecord(override)) { add(prefix, "例外必须是对象"); return }
    if (!isCalendarDate(override.date)) add(prefix + ".date", "原定日必须是有效日期")
    else {
      if (dates.has(override.date)) add(prefix + ".date", "同一原定日不能有重复例外")
      dates.add(override.date)
      if (validRule && (override.date < String(value.startOn) || monthlyDate(override.date.slice(0, 7), String(value.weekday), Number(value.weekOfMonth)) !== override.date)) add(prefix + ".date", "原定日必须对应月更规则中的日期")
    }
    if (override.occursOn !== undefined && !isCalendarDate(override.occursOn)) add(prefix + ".occursOn", "改期日期必须是有效日期")
    if (override.updateTime !== undefined && !isClockTime(override.updateTime)) add(prefix + ".updateTime", "更新时间必须是 HH:mm")
    if (override.cancelled !== undefined && typeof override.cancelled !== "boolean") add(prefix + ".cancelled", "取消标记必须是布尔值")
    if (override.cancelled && (override.occursOn !== undefined || override.updateTime !== undefined)) add(prefix, "取消不能同时填写改期或更新时间")
  })
  if (issues.length === 0) {
    const overrides = value.overrides as MonthlyActivityRecurrence["overrides"]
    const months = new Set(overrides!.flatMap(item => [item.date.slice(0, 7), ...(item.occursOn ? [item.occursOn.slice(0, 7)] : [])]))
    const actualDates = new Set<string>()
    for (const month of months) {
      const original = monthlyDate(month, String(value.weekday), Number(value.weekOfMonth))
      if (!original || original < String(value.startOn)) continue
      const index = overrides!.findIndex(item => item.date === original)
      const override = overrides![index]
      if (override?.cancelled) continue
      const actual = override?.occursOn ?? original
      if (actualDates.has(actual)) add(index >= 0 ? "overrides[" + index + "].occursOn" : "overrides", "改期后与另一回更新日重合，请调整或取消其中一回")
      actualDates.add(actual)
    }
  }
  return issues
}

/** Materialize ordinary performances only through the requested horizon, never an infinite list. */
export function getMonthlyPerformances(activity: Activity, through?: string): ActivityPerformance[] {
  if (activity.recurrence?.type !== "monthly" || monthlyRuleIssues(activity.recurrence).length) return []
  const rule: MonthlyActivityRecurrence = activity.recurrence
  const zone = sourceTimeZone(activity.timeZone)
  const end = through ?? dateTimeInZone(Date.now(), zone).slice(0, 10)
  if (!isCalendarDate(end)) return []
  const key = (performance: ActivityPerformance) => {
    const value = performance?.startAt ?? performance?.occursOn
    return typeof value === "string" ? value.slice(0, 10) : ""
  }
  const manual = (Array.isArray(activity.performances) ? activity.performances : []).filter(item => isCalendarDate(key(item)))
  const last = [end, ...manual.map(key), ...(rule.overrides ?? []).map(item => item.date)].sort().at(-1)!
  const [startYear, startMonth] = rule.startOn.split("-").map(Number)
  const [endYear, endMonth] = last.split("-").map(Number)
  const firstIndex = startYear * 12 + startMonth - 1
  const lastIndex = endYear * 12 + endMonth - 1
  const consumed = new Set<ActivityPerformance>()
  const result: ActivityPerformance[] = []
  for (let index = firstIndex; index <= lastIndex; index++) {
    const month = String(Math.floor(index / 12)).padStart(4, "0") + "-" + String(index % 12 + 1).padStart(2, "0")
    const date = monthlyDate(month, rule.weekday, rule.weekOfMonth)
    if (!date || date < rule.startOn || date > last) continue
    const saved = manual.find(item => key(item) === date)
    if (saved) consumed.add(saved)
    const override = rule.overrides?.find(item => item.date === date)
    if (override?.cancelled) continue
    let performance: ActivityPerformance = saved ? { ...saved } : { occursOn: date }
    if (override?.occursOn) performance = performance.startAt
      ? { ...performance, startAt: override.occursOn + performance.startAt.slice(10), endAt: undefined }
      : { ...performance, startAt: undefined, endAt: undefined, occursOn: override.occursOn }
    const clock = override?.updateTime ?? rule.updateTime
    let milestones = Array.isArray(performance.milestones) ? performance.milestones : []
    if (clock && (override?.updateTime || !milestones.some(item => item.kind === "update"))) {
      milestones = [...milestones.filter(item => item.kind !== "update"), { kind: "update", at: clock }]
    }
    if (milestones.length) performance.milestones = milestones
    if (performance.episode === undefined && rule.firstEpisode !== undefined) performance.episode = String(rule.firstEpisode + index - firstIndex)
    result.push(performance)
  }
  // Off-rule entries may represent a special episode; keep explicitly authored information.
  result.push(...manual.filter(item => !consumed.has(item)))
  return result.sort((a, b) => (a.startAt ?? a.occursOn).localeCompare(b.startAt ?? b.occursOn))
}

export function performanceUpdateInstant(performance: { startAt?: string; occursOn?: string; milestones?: ActivityPerformance["milestones"] }, zone: string) {
  if (performance.startAt) return instantFromSourceKey(performance.startAt, zone)
  if (!performance.occursOn) return null
  const updates = performance.milestones?.filter(item => item.kind === "update").map(item => item.at).sort()
  return instantFromSourceKey(updates?.length ? performance.occursOn + "T" + updates[0] : performance.occursOn, zone)
}
