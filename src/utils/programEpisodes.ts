import type { Activity, ActivityPerformance, Language } from "../types"
import { TRANSLATIONS } from "../i18n"
import { isCalendarDate, isCalendarDateTime, isHttpUrl } from "./contentValidation"
import { dateTimeForViewer, instantFromSourceKey, sourceTimeZone, viewerTimeZone } from "./timeZone"
import { getMonthlyPerformances, performanceUpdateInstant } from "./monthlySchedule"
import { getWeeklyPerformances } from "./activitySchedule"

export const PROGRAM_EPISODE_PAGE_SIZE = 5

export function hasEpisodeArchive(activity: Activity) {
  return activity.category === "Program" && activity.program?.display === "episodes"
}

export function performanceDateKey(performance: ActivityPerformance) {
  return performance.startAt ?? performance.occursOn
}

/** Episode presentation uses the same schedule records as every other activity. */
export function getProgramEpisodes(activity: Activity, now = Date.now()): ActivityPerformance[] {
  if (!hasEpisodeArchive(activity)) return []
  const zone = sourceTimeZone(activity.timeZone)
  const monthly = activity.recurrence?.type === "monthly"
  const performances = monthly ? getMonthlyPerformances(activity, dateTimeForViewer(now, zone).slice(0, 10))
    : activity.recurrence?.type === "weekly" ? getWeeklyPerformances(activity) : activity.performances ?? []
  return performances.filter(performance => {
    const date = performanceDateKey(performance)
    return (isCalendarDate(date) || isCalendarDateTime(date)) && instantFromSourceKey(date, zone) !== null &&
      (performanceUpdateInstant(performance, zone) ?? Infinity) <= now
  }).sort((a, b) => performanceDateKey(b).localeCompare(performanceDateKey(a)))
}

export function programEpisodeLabel(episode: ActivityPerformance, lang: Language) {
  return episode.label?.[lang] ?? (episode.episode
    ? TRANSLATIONS[lang].program_episode_number.replace("{episode}", episode.episode)
    : TRANSLATIONS[lang].program_episode_unknown)
}

export function programEpisodeLink(episode: ActivityPerformance) {
  return episode.status !== "expired" && isHttpUrl(episode.link) ? episode.link : undefined
}

export function programArchivePath(activityId: string, date?: string) {
  const path = `/museum/programs/${encodeURIComponent(activityId)}`
  return date ? `${path}?episode=${encodeURIComponent(date)}` : path
}

export function programEpisodeDate(episode: ActivityPerformance, activity: Activity, timeZone = viewerTimeZone()) {
  const date = performanceDateKey(episode)
  if (isCalendarDate(date)) return date
  const instant = instantFromSourceKey(date, sourceTimeZone(activity.timeZone))
  return instant === null ? date : dateTimeForViewer(instant, timeZone)
}
