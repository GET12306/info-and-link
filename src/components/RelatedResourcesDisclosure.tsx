import { ExternalLink } from "lucide-react"
import { TRANSLATIONS } from "../i18n"
import type { Language, RelatedResource, RelatedResourceLink } from "../types"
import { localizedText as archiveText } from "../utils/localizedText"
import {
  isRelatedResourceCollection,
  relatedResourceLinkCount,
  resourceLinkDetails,
  resourceLinkLabel,
} from "../utils/relatedResources"
import { CatalogDisclosure, CatalogItemTitle, CatalogTextLink } from "./ArchiveCatalog"
import ExpiredLinkBadge from "./ExpiredLinkBadge"

function ResourceLink({ link, index, resource, lang }: {
  link: string | RelatedResourceLink
  index: number
  resource: RelatedResource
  lang: Language
}) {
  const details = resourceLinkDetails(link)
  const status = details.status ?? resource.status
  return <li className="min-w-0 py-2">
    <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
      <span className="w-5 shrink-0 text-[10px] tabular-nums text-coco-ink/35" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
      <CatalogTextLink href={details.url} suffix={<ExternalLink className="mt-1 h-3 w-3 shrink-0 opacity-45" aria-hidden="true" />}>
        {resourceLinkLabel(link, lang)}
      </CatalogTextLink>
      {details.date && <time dateTime={details.date} className="text-[10px] text-coco-ink/40">{details.date}</time>}
      {status === "expired" && <ExpiredLinkBadge lang={lang} />}
    </div>
  </li>
}

function ResourceEntry({ resource, lang }: { resource: RelatedResource; lang: Language }) {
  const t = TRANSLATIONS[lang]
  const collection = isRelatedResourceCollection(resource)
  const title = archiveText(resource.title, lang)
  const description = archiveText(resource.description, lang)
  return <section className="grid gap-2 py-3 first:pt-0 sm:grid-cols-[7rem_minmax(0,1fr)] sm:gap-3">
    <div className="flex flex-wrap items-center gap-2 text-xs text-coco-ink/50 sm:flex-col sm:items-start">
      {resource.date && <time dateTime={resource.date}>{resource.date}</time>}
      <span className="rounded-full bg-coco-accent/5 px-2 py-0.5 text-coco-ink/55">
        {t[`resource_kind_${resource.kind}`]}
      </span>
    </div>
    <div className="min-w-0">
      {collection
        ? <CatalogItemTitle>{title}</CatalogItemTitle>
        : <CatalogItemTitle href={resource.url} suffix={<ExternalLink className="mt-1 h-3.5 w-3.5 shrink-0 opacity-45" aria-hidden="true" />}>{title}</CatalogItemTitle>}
      {description && <p className="mt-1 text-xs leading-5 text-coco-ink/60">{description}</p>}
      {collection && <CatalogDisclosure nested label={t.related_resource_collection.replace("{count}", String(resource.links.length))}>
        <ul className="grid min-w-0 grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-2">
          {resource.links.map((link, index) => <ResourceLink key={`${resourceLinkDetails(link).url}-${index}`} link={link} index={index} resource={resource} lang={lang} />)}
        </ul>
      </CatalogDisclosure>}
      {!collection && resource.status === "expired" && <div className="mt-1"><ExpiredLinkBadge lang={lang} /></div>}
    </div>
  </section>
}

export default function RelatedResourcesDisclosure({ resources, lang }: { resources?: RelatedResource[]; lang: Language }) {
  if (!resources?.length) return null
  const t = TRANSLATIONS[lang]
  const sorted = [...resources].sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""))
  const linkCount = resources.reduce((count, resource) => count + relatedResourceLinkCount(resource), 0)
  return <CatalogDisclosure label={t.related_resources_link.replace("{count}", String(linkCount))}>
    <div className="divide-y divide-coco-ink/10 dark:divide-white/10">
      {sorted.map((resource, index) => <ResourceEntry key={`${resource.date ?? "undated"}-${index}`} resource={resource} lang={lang} />)}
    </div>
  </CatalogDisclosure>
}
