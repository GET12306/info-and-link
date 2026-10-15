import { lazy, Suspense, useState } from "react"
import { ArrowRight, BookOpen, CalendarDays, Camera, Film, Radio, Search, Users, X } from "lucide-react"
import { Link } from "react-router-dom"
import { PageHeader, PageLayout } from "../components/PageLayout"
import { CatalogFilterBar } from "../components/ArchiveCatalog"
import { TRANSLATIONS } from "../i18n"
import type { Language } from "../types"
import { normalizeMuseumDateQuery, type MuseumCollection } from "../utils/museumSearchFilters"

const MuseumSearchResults = lazy(() => import("../components/MuseumSearchResults"))

type MuseumFilter = "all" | MuseumCollection

export default function Museum({ lang }: { lang: Language }) {
  const t = TRANSLATIONS[lang]
  const [query, setQuery] = useState("")
  const [dateInput, setDateInput] = useState("")
  const [collection, setCollection] = useState<MuseumFilter>("all")
  const collections = [
    { value: "credits" as const, to: "/museum/credits", title: t.credits, description: t.museum_credits_description, icon: Film },
    { value: "activities" as const, to: "/museum/activities", title: t.past_activities, description: t.museum_events_description, icon: CalendarDays },
    { value: "programs" as const, to: "/museum/programs", title: t.programs, description: t.museum_programs_description, icon: Radio },
    { value: "media" as const, to: "/museum/media", title: t.media, description: t.museum_media_description, icon: BookOpen },
    { value: "daily-posts" as const, to: "/museum/daily-posts", title: t.daily_posts, description: t.museum_daily_posts_description, icon: Camera },
    { value: "accounts" as const, to: "/museum/accounts", title: t.archived_accounts, description: t.museum_accounts_description, icon: Users },
  ]
  const collectionLabels = Object.fromEntries(collections.map(({ value, title }) => [value, title])) as Record<MuseumCollection, string>
  const dateQuery = normalizeMuseumDateQuery(dateInput)
  const searchActive = Boolean(query.trim() || dateInput.trim() || collection !== "all")
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

        {searchActive && dateQuery !== null && <Suspense fallback={
          <p role="status" className="mt-6 text-xs text-coco-ink/50">{t.museum_search_loading}</p>
        }>
          <MuseumSearchResults lang={lang} query={query} collection={collection} dateQuery={dateQuery} collectionLabels={collectionLabels} />
        </Suspense>}
      </section>
    </PageLayout>
  )
}
