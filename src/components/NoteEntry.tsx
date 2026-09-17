import type { Language, Note } from "../types"
import { TRANSLATIONS } from "../i18n"
import { CatalogEntry, CatalogEntryTitle, CatalogTextLink } from "./ArchiveCatalog"
import ExpiredLinkBadge from "./ExpiredLinkBadge"
import RelatedResourcesDisclosure from "./RelatedResourcesDisclosure"

export default function NoteEntry({ note, lang }: { note: Note; lang: Language }) {
  const t = TRANSLATIONS[lang]
  return <CatalogEntry>
    {(note.date || note.category || note.status === "expired") && <div className="mb-2 flex flex-wrap items-center gap-3 text-xs text-coco-ink/50">
      {note.date && <time dateTime={note.date}>{note.date}</time>}
      {note.category && <span>{note.category[lang]}</span>}
      {note.status === "expired" && <ExpiredLinkBadge lang={lang} />}
    </div>}
    <CatalogEntryTitle href={note.link}>{note.title[lang]}</CatalogEntryTitle>
    {note.description && <p className="mt-2 text-sm leading-6 text-coco-ink/60">{note.description[lang]}</p>}
    {!!note.relatedLinks?.length && <div className="mt-3">
      <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-coco-ink/35">{t.related_links}</div>
      <ul className="space-y-1">{note.relatedLinks.map((link, index) => <li key={`${link.url}-${index}`} className="flex min-w-0 flex-wrap items-center gap-2 text-xs">
        {link.type && <span className="text-coco-ink/40">{link.type[lang]}</span>}
        {link.status === "expired" && <ExpiredLinkBadge lang={lang} />}
        <CatalogTextLink href={link.url}>{link.title?.[lang] ?? link.url}</CatalogTextLink>
      </li>)}</ul>
    </div>}
    <RelatedResourcesDisclosure resources={note.relatedResources} lang={lang} />
  </CatalogEntry>
}
