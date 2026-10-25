import PROGRAMS from "../data/programs.yaml"
import type { Language, ProgramArchiveEntry } from "../types"
import EmptyState from "../components/EmptyState"
import ExpiredLinkBadge from "../components/ExpiredLinkBadge"
import { ArchiveCatalog, CatalogEntry, CatalogEntryTitle, CatalogGrid } from "../components/ArchiveCatalog"
import { TRANSLATIONS } from "../i18n"
import RelatedResourcesDisclosure from "../components/RelatedResourcesDisclosure"
import ACTIVITIES from "../data/activities"
import { hasEpisodeArchive } from "../utils/programEpisodes"
import ProgramEpisodes from "../components/ProgramEpisodes"

export default function Programs({ lang }: { lang: Language }) {
  const t = TRANSLATIONS[lang]
  const programs = PROGRAMS as ProgramArchiveEntry[]
  const episodePrograms = ACTIVITIES.filter(hasEpisodeArchive)

  return <ArchiveCatalog title={t.programs} backLabel={t.back_to_museum}>
    {programs.length || episodePrograms.length ? <CatalogGrid>
      {episodePrograms.map(activity => {
        const description = activity.description?.[lang]
        return <CatalogEntry key={activity.id}>
          <CatalogEntryTitle href={activity.link}>{activity.title[lang]}</CatalogEntryTitle>
          {description && <p className="mt-2 break-words text-sm leading-6 text-coco-ink/60">{description}</p>}
          <ProgramEpisodes activity={activity} lang={lang} compact />
        </CatalogEntry>
      })}
      {programs.map((program, index) => <CatalogEntry key={`${program.date}-${program.title.en}-${index}`}>
        <div className="mb-2 flex flex-wrap items-center gap-3 text-xs text-coco-ink/50">
          <span>{program.date}</span>
          {program.status === "expired" && <ExpiredLinkBadge lang={lang} />}
        </div>
        <CatalogEntryTitle href={program.url}>{program.title[lang]}</CatalogEntryTitle>
        {program.description && <p className="mt-2 text-sm leading-6 text-coco-ink/60">{program.description[lang]}</p>}
        <RelatedResourcesDisclosure resources={program.relatedResources} lang={lang} />
      </CatalogEntry>)}
    </CatalogGrid> : <EmptyState title={t.coming_soon} />}
  </ArchiveCatalog>
}
