import type { DailyPost, ActivityResourcePlatform } from "../types"

export function dailyPostPlatform(post: DailyPost): ActivityResourcePlatform {
  if (post.platform) return post.platform
  try {
    const host = new URL(post.url).hostname.toLowerCase()
    const matches = (domain: string) => host === domain || host.endsWith(`.${domain}`)
    if (matches("x.com") || matches("twitter.com")) return "x"
    if (matches("instagram.com")) return "instagram"
    if (matches("youtube.com") || matches("youtu.be")) return "youtube"
    return "web"
  } catch { return "other" }
}

export function sortDailyPosts(posts: DailyPost[]) {
  return [...posts].sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""))
}
