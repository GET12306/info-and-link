import { useId, useState } from "react"
import { Radio } from "lucide-react"
import { Link } from "react-router-dom"
import type { Activity, ActivityPerformance, Language } from "../types"
import { TRANSLATIONS } from "../i18n"
import { getProgramEpisodes, performanceDateKey, PROGRAM_EPISODE_PAGE_SIZE, programArchivePath, programEpisodeLabel, programEpisodeLink } from "../utils/programEpisodes"
import { instantFromSourceKey, sourceTimeZone, viewerTimeZone } from "../utils/timeZone"
import ExternalAnchor from "./ExternalAnchor"
import ExpiredLinkBadge from "./ExpiredLinkBadge"
import { CatalogDisclosure } from "./ArchiveCatalog"
import ActivityDisclosureButton from "./ActivityDisclosureButton"

function EpisodeDate({ episode, activity, lang }: { episode: ActivityPerformance; activity: Activity; lang: Language }) {
  const key = performanceDateKey(episode)
  const timed = Boolean(episode.startAt)
  const instant = instantFromSourceKey(key, sourceTimeZone(activity.timeZone))!
  const date = timed ? new Date(instant) : new Date(`${key}T12:00:00Z`)
  return <time dateTime={timed ? date.toISOString() : key}>
    {new Intl.DateTimeFormat(lang === "ja" ? "ja-JP" : "en-US", {
      timeZone: timed ? viewerTimeZone() : "UTC",
      year: "numeric", month: "short", day: "numeric",
      ...(timed ? { hour: "2-digit", minute: "2-digit" } as const : {}),
    }).format(date)}
  </time>
}

export default function ProgramEpisodes({ activity, lang, full = false, compact = false, selectedPublishedAt }: {
  activity: Activity
  lang: Language
  full?: boolean
  compact?: boolean
  selectedPublishedAt?: string | null
}) {
  const t = TRANSLATIONS[lang]
  const episodes = getProgramEpisodes(activity)
  const selectedIndex = episodes.findIndex(episode => performanceDateKey(episode) === selectedPublishedAt)
  const [page, setPage] = useState(() => full && selectedIndex >= 0 ? Math.floor(selectedIndex / PROGRAM_EPISODE_PAGE_SIZE) : 0)
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const countLabel = t.program_episode_count.replace("{count}", String(episodes.length))
  const pageCount = Math.max(1, Math.ceil(episodes.length / PROGRAM_EPISODE_PAGE_SIZE))
  const currentPage = Math.min(page, pageCount - 1)
  const visibleEpisodes = episodes.slice(currentPage * PROGRAM_EPISODE_PAGE_SIZE, (currentPage + 1) * PROGRAM_EPISODE_PAGE_SIZE)
  const pagination = pageCount > 1 && <nav aria-label={t.program_episode_pages} className="mt-3 flex flex-wrap items-center gap-3 text-xs text-coco-ink/60">
    <button type="button" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)} className="min-h-11 rounded border grid-line px-3 transition-colors hover:text-coco-accent disabled:cursor-default disabled:opacity-35">{t.program_episode_previous}</button>
    <span aria-live="polite">{currentPage + 1} / {pageCount}</span>
    <button type="button" disabled={currentPage === pageCount - 1} onClick={() => setPage(currentPage + 1)} className="min-h-11 rounded border grid-line px-3 transition-colors hover:text-coco-accent disabled:cursor-default disabled:opacity-35">{t.program_episode_next}</button>
  </nav>

  const list = <ol className="overflow-hidden rounded border grid-line bg-coco-ink/2.5 dark:bg-white/2.5">
    {visibleEpisodes.map(episode => {
      const url = programEpisodeLink(episode)
      const key = performanceDateKey(episode)
      const selected = key === selectedPublishedAt
      return <li
        id={full ? `program-episode-${key}` : undefined}
        key={key}
        className={`scroll-mt-28 grid gap-1 border-b grid-line px-4 py-3 last:border-b-0 ${compact ? "" : "sm:grid-cols-[14rem_minmax(0,1fr)] sm:gap-5"} ${selected ? "border-l-2 border-l-coco-accent bg-coco-accent/5" : ""}`}
      >
        <span className="text-sm leading-6 text-coco-ink/60"><EpisodeDate episode={episode} activity={activity} lang={lang} /></span>
        <div className="min-w-0 space-y-1">
          {url
            ? <ExternalAnchor href={url} className="inline-block break-words text-sm leading-6 text-coco-ink/80 transition-colors hover:text-coco-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coco-accent">{programEpisodeLabel(episode, lang)}</ExternalAnchor>
            : <span className="text-sm leading-6 text-coco-ink/80">{programEpisodeLabel(episode, lang)}</span>}
          {episode.description && <p className="break-words text-sm leading-6 text-coco-ink/60">{episode.description[lang]}</p>}
          {!url && (episode.status === "expired" ? <ExpiredLinkBadge lang={lang} />
            : <p className="text-xs leading-5 text-coco-ink/45">{t.program_episode_record_only}</p>)}
        </div>
      </li>
    })}
  </ol>

  if (full) return <div className="mt-4 min-w-0 space-y-3">
    {episodes.length === 0 ? <p className="text-sm text-coco-ink/55">{t.program_episode_empty}</p> : <>
      <p className="text-sm text-coco-ink/60">{countLabel}</p>
      {list}
      {pagination}
    </>}
  </div>

  const recentPanel = () => <>
    {episodes.length ? list : <p className="text-sm text-coco-ink/55">{t.program_episode_empty}</p>}
    {pagination}
    {episodes.length > visibleEpisodes.length && <Link to={programArchivePath(activity.id)} className="mt-2 inline-flex min-h-11 items-center text-sm text-coco-ink/60 transition-colors hover:text-coco-accent">{t.program_episode_all}</Link>}
  </>

  if (compact) return <CatalogDisclosure deferMount label={t.program_episode_recent}>{recentPanel}</CatalogDisclosure>

  return <div className="mt-4 min-w-0">
    <ActivityDisclosureButton
      label={t.program_episode_recent}
      icon={<Radio className="h-3.5 w-3.5" aria-hidden="true" />}
      open={open}
      panelId={panelId}
      onClick={() => setOpen(!open)}
    />
    <div id={panelId} hidden={!open} className="mt-3">{open && recentPanel()}</div>
  </div>
}
