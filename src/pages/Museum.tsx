import { useMemo, useState } from "react"
import { ArrowRight, BookOpen, CalendarDays, Camera, ExternalLink, Film, Radio, Search, X } from "lucide-react"
import { Link } from "react-router-dom"
import { PageHeader, PageLayout } from "../components/PageLayout"
import { CatalogEntry, CatalogFilterBar, CatalogGrid } from "../components/ArchiveCatalog"
import ExternalAnchor from "../components/ExternalAnchor"
import ACTIVITIES from "../data/activities.yaml"
import CREDITS from "../data/credits.yaml"
import DAILY_POSTS from "../data/daily-posts.yaml"
import MAGAZINES from "../data/magazines.yaml"
import NOTES from "../data/notes.yaml"
import PHOTOBOOKS from "../data/photobooks.yaml"
import PROGRAMS from "../data/programs.yaml"
import { TRANSLATIONS } from "../i18n"
import type { Activity, Credit, DailyPost, Language, Magazine, Note, PhotoBook, ProgramArchiveEntry } from "../types"
import useJapanNow from "../hooks/useJapanNow"
import { getPastActivities } from "../utils/activityStatus"
import {
  buildMuseumSearchItems,
  filterMuseumItems,
  normalizeMuseumDateQuery,
  type MuseumCollection,
} from "../utils/museumSearch"

type MuseumFilter = "all" | MuseumCollection

export default function Museum({ lang }: { lang: Language }) {
  const t = TRANSLATIONS[lang]
  const now = useJapanNow()
  const [query, setQuery] = useState("")
  const [dateInput, setDateInput] = useState("")
  const [collection, setCollection] = useState<MuseumFilter>("all")
  const collections = [
    { value: "credits" as const, to: "/museum/credits", title: t.credits, description: t.museum_credits_description, icon: Film },
    { value: "activities" as const, to: "/museum/activities", title: t.past_activities, description: t.museum_events_description, icon: CalendarDays },
    { value: "programs" as const, to: "/museum/programs", title: t.programs, description: t.museum_programs_description, icon: Radio },
    { value: "media" as const, to: "/museum/media", title: t.media, description: t.museum_media_description, icon: BookOpen },
    { value: "daily-posts" as const, to: "/museum/daily-posts", title: t.daily_posts, description: t.museum_daily_posts_description, icon: Camera },
  ]
  const collectionLabels = Object.fromEntries(collections.map(({ value, title }) => [value, title])) as Record<MuseumCollection, string>
  const dateQuery = normalizeMuseumDateQuery(dateInput)
  const searchItems = useMemo(() => buildMuseumSearchItems({
    credits: CREDITS as Credit[],
    activities: getPastActivities(ACTIVITIES as Activity[], now),
    programs: PROGRAMS as ProgramArchiveEntry[],
    photobooks: PHOTOBOOKS as PhotoBook[],
    magazines: MAGAZINES as Magazine[],
    notes: NOTES as Note[],
    dailyPosts: DAILY_POSTS as DailyPost[],
  }, lang), [lang, now])
  const searchActive = Boolean(query.trim() || dateInput.trim() || collection !== "all")
  const results = dateQuery === null ? [] : filterMuseumItems(searchItems, query, collection, dateQuery)
  const filters: { value: MuseumFilter; label: string }[] = [
    { value: "all", label: t.museum_search_all },
    ...collections.map(({ value, title }) => ({ value, label: title })),
  ]
  const clearSearch = () => {
    setQuery("")
    setDateInput("")
    setCollection("all")
  }

  return (
    <PageLayout compact>
      <PageHeader title={t.museum} subtitle={t.museum_subtitle}>
        <p className="mt-6 max-w-2xl text-sm leading-7 text-coco-ink/60">
          {t.museum_introduction}
        </p>
      </PageHeader>
      <nav aria-label={t.museum_collections} className="grid gap-4 sm:grid-cols-2">
        {collections.map(({ to, title, description, icon: Icon }, index) => (
          <Link
            key={to}
            to={to}
            className="group flex flex-col rounded-xl border grid-line p-6 transition-colors hover:border-coco-accent/50 hover:bg-coco-accent/5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-coco-accent md:p-8"
          >
            <div className="mb-8 flex items-center justify-between">
              <Icon className="h-5 w-5 text-coco-accent" aria-hidden="true" />
              <span className="text-xs tracking-widest text-coco-ink/35" aria-hidden="true">0{index + 1}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-2xl font-serif">{title}</h2>
              <ArrowRight className="h-4 w-4 shrink-0 text-coco-ink/40 transition-transform group-hover:translate-x-1 group-hover:text-coco-accent" aria-hidden="true" />
            </div>
            <p className="mt-3 text-sm leading-6 text-coco-ink/55">{description}</p>
          </Link>
        ))}
      </nav>
      <section aria-labelledby="museum-search-title" className="mt-12 border-t grid-line pt-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="museum-search-title" className="flex items-center gap-2 font-serif text-2xl">
              <Search className="h-4 w-4 text-coco-accent" aria-hidden="true" />
              {t.museum_search}
            </h2>
            <p className="mt-2 text-xs leading-6 text-coco-ink/50">{t.museum_search_description}</p>
          </div>
          {searchActive && <button type="button" onClick={clearSearch} className="inline-flex items-center gap-1.5 text-xs text-coco-ink/55 transition-colors hover:text-coco-accent">
            <X className="h-3.5 w-3.5" aria-hidden="true" />{t.museum_search_clear}
          </button>}
        </div>
        <div className="catalog-toolbar mt-5">
          <label>
            <span className="mb-1.5 block text-xs text-coco-ink/55">{t.museum_search_keyword}</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t.museum_search_keyword_placeholder} type="search" />
          </label>
          <label>
            <span className="mb-1.5 block text-xs text-coco-ink/55">{t.museum_search_date}</span>
            <input
              value={dateInput}
              onChange={(event) => setDateInput(event.target.value)}
              placeholder={t.museum_search_date_placeholder}
              inputMode="numeric"
              aria-invalid={dateQuery === null}
              aria-describedby="museum-date-help"
            />
          </label>
        </div>
        <p id="museum-date-help" className={`mt-2 text-xs leading-5 ${dateQuery === null ? "text-coco-accent" : "text-coco-ink/45"}`}>
          {dateQuery === null ? t.museum_search_date_error : t.museum_search_date_help}
        </p>
        <div className="mt-4">
          <CatalogFilterBar<MuseumFilter> label={t.museum_search_collection} options={filters} value={collection} onChange={setCollection} />
        </div>

        {searchActive && dateQuery !== null && <div className="mt-6">
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
        </div>}
      </section>
    </PageLayout>
  )
}
