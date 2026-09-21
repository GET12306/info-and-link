import { ExternalLink } from "lucide-react"
import DATA from "../data/daily-posts.yaml"
import type { DailyPost, Language, ActivityResourcePlatform } from "../types"
import { TRANSLATIONS } from "../i18n"
import { localizedText } from "../utils/localizedText"
import { dailyPostPlatform, sortDailyPosts } from "../utils/dailyPosts"
import { ArchiveCatalog, CatalogEntry, CatalogEntryTitle, CatalogGrid } from "../components/ArchiveCatalog"
import ExpiredLinkBadge from "../components/ExpiredLinkBadge"

export default function DailyPosts({ lang }: { lang: Language }) {
  const t = TRANSLATIONS[lang]
  const posts = DATA as DailyPost[]
  const visible = sortDailyPosts(posts)
  const platforms: Record<ActivityResourcePlatform, string> = { x: "X", instagram: "Instagram", youtube: "YouTube", web: t.daily_posts_web, other: t.daily_posts_other }
  return <ArchiveCatalog title={t.daily_posts} backLabel={t.back_to_museum}>
    <p role="status" className="text-xs text-coco-ink/50">{t.daily_posts_count.replace("{count}", String(visible.length))}</p>
    {visible.length ? <CatalogGrid>{visible.map((post, index) => <CatalogEntry key={post.id ?? `${post.url}-${index}`}>
      <div className="mb-2 flex flex-wrap items-center gap-3 text-xs text-coco-ink/50">
        {post.date && <time dateTime={post.date}>{post.date}</time>}
        <span>{platforms[dailyPostPlatform(post)]}</span>
        {post.status === "expired" && <ExpiredLinkBadge lang={lang} />}
      </div>
      <CatalogEntryTitle href={post.url} suffix={<ExternalLink className="mt-1 h-3.5 w-3.5 shrink-0 opacity-45" aria-hidden="true" />}>{localizedText(post.title, lang)}</CatalogEntryTitle>
      {post.description && <p className="mt-2 whitespace-pre-line text-sm leading-6 text-coco-ink/60">{localizedText(post.description, lang)}</p>}
      {!!post.tags?.length && <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-coco-ink/45">{post.tags.map((tag, index) => <li key={index}>#{localizedText(tag, lang)}</li>)}</ul>}
    </CatalogEntry>)}</CatalogGrid> : <p className="text-sm text-coco-ink/60">{t.daily_posts_empty}</p>}
  </ArchiveCatalog>
}
