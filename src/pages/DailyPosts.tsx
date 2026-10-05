import { ExternalLink } from "lucide-react"
import DATA from "../data/daily-posts.yaml"
import type { DailyPost, Language, ActivityResourcePlatform } from "../types"
import { TRANSLATIONS } from "../i18n"
import { localizedText } from "../utils/localizedText"
import { dailyPostDate, dailyPostLinks, dailyPostPrimaryLink, dailyPostRelatedLinks, sortDailyPosts } from "../utils/dailyPosts"
import { ArchiveCatalog, CatalogEntry, CatalogEntryTitle, CatalogGrid, CatalogTextLink } from "../components/ArchiveCatalog"
import ExpiredLinkBadge from "../components/ExpiredLinkBadge"

export default function DailyPosts({ lang }: { lang: Language }) {
  const t = TRANSLATIONS[lang]
  const posts = DATA as DailyPost[]
  const visible = sortDailyPosts(posts)
  const platforms: Record<ActivityResourcePlatform, string> = { x: "X", instagram: "Instagram", youtube: "YouTube", web: t.daily_posts_web, other: t.daily_posts_other }
  return <ArchiveCatalog title={t.daily_posts} backLabel={t.back_to_museum}>
    <p role="status" className="text-xs text-coco-ink/50">{t.daily_posts_count.replace("{count}", String(visible.length))}</p>
    {visible.length ? <CatalogGrid>{visible.map((post, index) => {
      const links = dailyPostLinks(post)
      const relatedLinks = dailyPostRelatedLinks(post)
      const date = dailyPostDate(post)
      const platformLabels = [...new Set(links.map((link) => platforms[link.platform]))]
      const primaryLink = dailyPostPrimaryLink(post)
      return <CatalogEntry key={post.id ?? `${primaryLink?.url ?? "post"}-${index}`}>
      <div className="mb-2 flex flex-wrap items-center gap-3 text-xs text-coco-ink/50">
        {date && <time dateTime={date}>{date}</time>}
        {platformLabels.length > 0 && <span>{platformLabels.join(" / ")}</span>}
        {primaryLink.status === "expired" && <ExpiredLinkBadge lang={lang} />}
      </div>
      <CatalogEntryTitle
        href={primaryLink?.status === "expired" ? undefined : primaryLink?.url}
        suffix={primaryLink?.status !== "expired" ? <ExternalLink className="mt-1 h-3.5 w-3.5 shrink-0 opacity-45" aria-hidden="true" /> : undefined}
      >{localizedText(post.title, lang)}</CatalogEntryTitle>
      {post.description && <p className="mt-2 whitespace-pre-line text-sm leading-6 text-coco-ink/60">{localizedText(post.description, lang)}</p>}
      {!!post.tags?.length && <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-coco-ink/45">{post.tags.map((tag, index) => <li key={index}>#{localizedText(tag, lang)}</li>)}</ul>}
      {relatedLinks.length > 0 && <div className="mt-3 border-t border-coco-ink/10 pt-2">
        <p className="mb-1 text-[0.68rem] font-medium tracking-wide text-coco-ink/45">{t.daily_posts_related.replace("{count}", String(relatedLinks.length))}</p>
        <ol className="divide-y divide-coco-ink/10">{relatedLinks.map((link, linkIndex) => <li key={`${link.url}-${linkIndex}`} className="flex min-w-0 items-start gap-2 py-2">
          <span className="w-5 shrink-0 pt-0.5 text-[0.65rem] tabular-nums text-coco-ink/35">{String(linkIndex + 1).padStart(2, "0")}</span>
          <div className="min-w-0 flex-1">
            <CatalogTextLink href={link.url} suffix={<ExternalLink className="mt-0.5 h-3 w-3 shrink-0 opacity-45" aria-hidden="true" />}>
              {localizedText(link.label, lang) || t.daily_posts_related_link.replace("{number}", String(linkIndex + 1))}
            </CatalogTextLink>
            {((link.date && link.date !== date) || platformLabels.length > 1 || link.status === "expired") && <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[0.68rem] text-coco-ink/40">
              {link.date && link.date !== date && <time dateTime={link.date}>{link.date}</time>}
              {platformLabels.length > 1 && <span>{platforms[link.platform]}</span>}
              {link.status === "expired" && <ExpiredLinkBadge lang={lang} />}
            </div>}
          </div>
        </li>)}</ol>
      </div>}
    </CatalogEntry>})}</CatalogGrid> : <p className="text-sm text-coco-ink/60">{t.daily_posts_empty}</p>}
  </ArchiveCatalog>
}
