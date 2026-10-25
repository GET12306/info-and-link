import { useMemo } from "react"
import { ExternalLink } from "lucide-react"
import { Link } from "react-router-dom"
import { CatalogEntry, CatalogGrid } from "./ArchiveCatalog"
import ExternalAnchor from "./ExternalAnchor"
import ACTIVITIES from "../data/activities"
import ARCHIVED_ACCOUNTS from "../data/archived-accounts.yaml"
import CREDITS from "../data/credits.yaml"
import DAILY_POSTS from "../data/daily-posts.yaml"
import MAGAZINES from "../data/magazines.yaml"
import NOTES from "../data/notes.yaml"
import PHOTOBOOKS from "../data/photobooks.yaml"
import PROGRAMS from "../data/programs.yaml"
import { TRANSLATIONS } from "../i18n"
import type { Activity, ArchivedAccount, Credit, DailyPost, Language, Magazine, Note, PhotoBook, ProgramArchiveEntry } from "../types"
import useJapanNow from "../hooks/useJapanNow"
import { getPastActivities } from "../utils/activityStatus"
import { buildMuseumSearchItems, sortMuseumSearchItems, type MuseumSearchSources } from "../utils/museumSearch"
import { filterMuseumItems, type MuseumCollection } from "../utils/museumSearchFilters"

const emptySources: MuseumSearchSources = {
  credits: [], activities: [], programs: [], photobooks: [], magazines: [], notes: [], dailyPosts: [], accounts: [],
}
const staticSources: MuseumSearchSources = {
  credits: CREDITS as Credit[], activities: [], programs: PROGRAMS as ProgramArchiveEntry[],
  episodePrograms: ACTIVITIES,
  photobooks: PHOTOBOOKS as PhotoBook[], magazines: MAGAZINES as Magazine[], notes: NOTES as Note[],
  dailyPosts: DAILY_POSTS as DailyPost[], accounts: ARCHIVED_ACCOUNTS as ArchivedAccount[],
}

export default function MuseumSearchResults({ lang, query, collection, dateQuery, collectionLabels }: {
  lang: Language
  query: string
  collection: "all" | MuseumCollection
  dateQuery: string
  collectionLabels: Record<MuseumCollection, string>
}) {
  const t = TRANSLATIONS[lang]
  const now = useJapanNow()
  const activities = useMemo(() => getPastActivities(ACTIVITIES as Activity[], now), [now])
  // Minute-by-minute activity status changes do not rebuild the static collections.
  const staticItems = useMemo(() => buildMuseumSearchItems(staticSources, lang), [lang])
  const activityItems = useMemo(() => buildMuseumSearchItems({ ...emptySources, activities }, lang), [activities, lang])
  const searchItems = useMemo(() => sortMuseumSearchItems([...staticItems, ...activityItems], lang), [staticItems, activityItems, lang])
  const results = filterMuseumItems(searchItems, query, collection, dateQuery)

  return (
    <div className="mt-6">
      <p role="status" className="mb-3 text-xs text-coco-ink/50">{t.museum_search_count.replace("{count}", String(results.length))}</p>
      {results.length ? <CatalogGrid>{results.map((item) => <CatalogEntry key={item.id}>
        <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-coco-ink/45">
          <span>{collectionLabels[item.collection]}</span>
          {item.dateLabel && <span>{item.dateLabel}</span>}
        </div>
        <h3 className="min-w-0 break-words font-serif text-base font-normal leading-6">
          {item.href ? <ExternalAnchor href={item.href} className="inline-flex min-w-0 items-start gap-1.5 transition-colors hover:text-coco-accent">
            <span>{item.title}</span><ExternalLink className="mt-1 h-3.5 w-3.5 shrink-0 opacity-45" aria-hidden="true" />
          </ExternalAnchor> : <Link to={item.path} className="transition-colors hover:text-coco-accent">{item.title}</Link>}
        </h3>
        {item.description && <p className="mt-2 line-clamp-3 whitespace-pre-line text-sm leading-6 text-coco-ink/60">{item.description}</p>}
      </CatalogEntry>)}</CatalogGrid> : <p className="text-sm text-coco-ink/60">{t.museum_search_no_results}</p>}
    </div>
  )
}
