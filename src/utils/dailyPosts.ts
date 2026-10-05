import type { DailyPost, DailyPostLink, ActivityResourcePlatform } from "../types"

function platformFromUrl(url: string): ActivityResourcePlatform {
  try {
    const host = new URL(url).hostname.toLowerCase()
    const matches = (domain: string) => host === domain || host.endsWith(`.${domain}`)
    if (matches("x.com") || matches("twitter.com")) return "x"
    if (matches("instagram.com")) return "instagram"
    if (matches("youtube.com") || matches("youtu.be")) return "youtube"
    return "web"
  } catch { return "other" }
}

export interface ResolvedDailyPostLink extends DailyPostLink {
  platform: ActivityResourcePlatform
  status?: "available" | "expired"
}

export function isDailyPostSeries(post: DailyPost): post is DailyPost & { links: (string | DailyPostLink)[] } {
  return Array.isArray(post.links) && post.links.length > 0
}

function resolveDailyPostLink(post: DailyPost, link: string | DailyPostLink): ResolvedDailyPostLink {
    const details: DailyPostLink = typeof link === "string" ? { url: link } : link
    return {
      ...details,
      date: details.date ?? post.date,
      platform: details.platform ?? post.platform ?? platformFromUrl(details.url),
      status: details.status ?? post.status,
    }
}

export function dailyPostPrimaryLink(post: DailyPost): ResolvedDailyPostLink {
  return resolveDailyPostLink(post, post.url)
}

/** Resolve optional related links and inherit defaults from the primary post. */
export function dailyPostRelatedLinks(post: DailyPost): ResolvedDailyPostLink[] {
  return (post.links ?? []).map((link) => resolveDailyPostLink(post, link))
}

/** All links in a topic, with the primary post first. */
export function dailyPostLinks(post: DailyPost): ResolvedDailyPostLink[] {
  return [dailyPostPrimaryLink(post), ...dailyPostRelatedLinks(post)]
}

export function dailyPostDate(post: DailyPost) {
  if (post.date) return post.date
  return dailyPostLinks(post).map((link) => link.date ?? "").sort().at(-1) || undefined
}

/** Preserve the original single-value helper for callers that need a primary platform. */
export function dailyPostPlatform(post: DailyPost): ActivityResourcePlatform {
  return dailyPostPrimaryLink(post).platform
}

export function sortDailyPosts(posts: DailyPost[]) {
  return [...posts].sort((a, b) => (dailyPostDate(b) ?? "").localeCompare(dailyPostDate(a) ?? ""))
}
