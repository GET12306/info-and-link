import { Link, useLocation, useParams, useSearchParams } from "react-router-dom"
import ACTIVITIES from "../data/activities"
import type { Language } from "../types"
import { TRANSLATIONS } from "../i18n"
import { hasEpisodeArchive } from "../utils/programEpisodes"
import ProgramEpisodes from "../components/ProgramEpisodes"
import ExternalAnchor from "../components/ExternalAnchor"
import { useActivityHighlight } from "../hooks/useActivityHighlight"

export default function ProgramDetails({ lang }: { lang: Language }) {
  const { activityId } = useParams()
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const publishedAt = searchParams.get("episode")
  useActivityHighlight(publishedAt ?? undefined, "program-episode-", location.key)
  const activity = ACTIVITIES.find(item => item.id === activityId && hasEpisodeArchive(item))
  const t = TRANSLATIONS[lang]
  const description = activity && activity.description?.[lang]

  return <div className="archive-catalog">
    <header className="catalog-header">
      <Link to="/museum/programs" className="inline-flex min-h-11 items-center text-sm text-coco-ink/60 hover:text-coco-accent">← {t.program_episode_back}</Link>
      <h1 className="mt-4 break-words font-serif text-3xl sm:text-4xl">{activity?.title[lang] ?? t.program_episode_not_found}</h1>
      {activity && <>
        {description && <p className="mt-3 break-words text-sm leading-6 text-coco-ink/60">{description}</p>}
        <ExternalAnchor href={activity.link} className="mt-2 inline-flex min-h-11 items-center text-sm text-coco-accent hover:underline">{t.program_episode_homepage}</ExternalAnchor>
      </>}
    </header>
    {activity && <ProgramEpisodes key={`${activity.id}-${publishedAt ?? ""}`} activity={activity} lang={lang} full selectedPublishedAt={publishedAt} />}
  </div>
}
