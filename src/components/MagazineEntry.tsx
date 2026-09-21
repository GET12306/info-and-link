import { useState } from "react"
import { ExternalLink } from "lucide-react"
import type { Language, Magazine } from "../types"
import { TRANSLATIONS } from "../i18n"
import { localizedText as archiveText } from "../utils/localizedText"
import { CatalogEntry, CatalogEntryTitle, CatalogTextLink } from "./ArchiveCatalog"
import ExternalAnchor from "./ExternalAnchor"
import ExpiredLinkBadge from "./ExpiredLinkBadge"
import RelatedResourcesDisclosure from "./RelatedResourcesDisclosure"

export default function MagazineEntry({ entry, lang }: { entry: Magazine; lang: Language }) {
  const t = TRANSLATIONS[lang]
  const [coverFailed, setCoverFailed] = useState(false)
  const title = archiveText(entry.title, lang)
  const metadata = [
    [t.magazines_publisher, archiveText(entry.publisher, lang)],
    [t.magazines_pages, archiveText(entry.pages, lang)],
    [t.magazines_isbn, archiveText(entry.isbn, lang)],
  ].filter((detail): detail is [string, string] => Boolean(detail[1]))

  return <CatalogEntry>
    <div className="flex items-start gap-3">
      {entry.cover && !coverFailed && <div className="w-16 shrink-0">
        <img src={entry.cover.url} alt={archiveText(entry.cover.alt, lang) || title} loading="lazy" onError={() => setCoverFailed(true)} className="max-h-28 w-full object-contain object-top" />
        {entry.cover.sourceUrl && <ExternalAnchor href={entry.cover.sourceUrl} className="mt-1 block text-[10px] text-coco-ink/55 hover:text-coco-accent">{t.magazines_cover_source}</ExternalAnchor>}
      </div>}
      <div className="min-w-0 flex-1">
        {(entry.publicationDate || entry.issue) && <div className="mb-1 flex flex-wrap gap-x-3 text-xs leading-5 text-coco-ink/55">
          {entry.publicationDate && <span>{entry.publicationDate}</span>}
          {entry.issue && <span>{archiveText(entry.issue, lang)}</span>}
        </div>}
        <CatalogEntryTitle>{title}</CatalogEntryTitle>
        {entry.feature && <p className="mt-1 text-sm leading-6 text-coco-ink/80">{archiveText(entry.feature, lang)}</p>}
        {metadata.length > 0 && <dl className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs leading-5">{metadata.map(([label, value]) => <div key={label} className="flex gap-2"><dt className="text-coco-ink/45">{label}</dt><dd className="text-coco-ink/70">{value}</dd></div>)}</dl>}
        {entry.notes && <p className="mt-2 whitespace-pre-line text-xs leading-5 text-coco-ink/55">{archiveText(entry.notes, lang)}</p>}
        {!!entry.links?.length && <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">{entry.links.map((link, index) => <li key={`${link.url}-${index}`} className="flex items-center gap-2">
          <CatalogTextLink href={link.url} suffix={<ExternalLink className="mt-1 h-3 w-3 shrink-0" />}>{archiveText(link.label, lang) || t.magazines_link}</CatalogTextLink>
          {link.status === "expired" && <ExpiredLinkBadge lang={lang} />}
        </li>)}</ul>}
        <RelatedResourcesDisclosure resources={entry.relatedResources} lang={lang} />
      </div>
    </div>
  </CatalogEntry>
}
