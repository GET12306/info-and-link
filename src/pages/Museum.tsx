import { ArrowRight, BookOpen, CalendarDays, Film, Radio } from "lucide-react"
import { Link } from "react-router-dom"
import { PageHeader, PageLayout } from "../components/PageLayout"
import { TRANSLATIONS } from "../i18n"
import type { Language } from "../types"

export default function Museum({ lang }: { lang: Language }) {
  const t = TRANSLATIONS[lang]
  const collections = [
    { to: "/museum/credits", title: t.credits, description: t.museum_credits_description, icon: Film },
    { to: "/museum/activities", title: t.past_activities, description: t.museum_events_description, icon: CalendarDays },
    { to: "/museum/programs", title: t.programs, description: t.museum_programs_description, icon: Radio },
    { to: "/museum/media", title: t.media, description: t.museum_media_description, icon: BookOpen },
  ]

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
    </PageLayout>
  )
}
