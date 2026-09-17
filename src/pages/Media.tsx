import { useState } from "react"
import PHOTOBOOKS from "../data/photobooks.yaml"
import MAGAZINES from "../data/magazines.yaml"
import NOTES from "../data/notes.yaml"
import type { Language, Magazine, Note, PhotoBook } from "../types"
import { TRANSLATIONS } from "../i18n"
import { ArchiveCatalog, CatalogFilterBar, CatalogGrid } from "../components/ArchiveCatalog"
import MagazineEntry from "../components/MagazineEntry"
import NoteEntry from "../components/NoteEntry"
import PhotoBookEntry from "../components/PhotoBookEntry"

type MediaFilter = "all" | "photobook" | "magazine" | "article"
type MediaItem =
  | { kind: "photobook"; date: string; key: string; value: PhotoBook }
  | { kind: "magazine"; date: string; key: string; value: Magazine }
  | { kind: "article"; date: string; key: string; value: Note }

export default function Media({ lang }: { lang: Language }) {
  const t = TRANSLATIONS[lang]
  const [filter, setFilter] = useState<MediaFilter>("all")
  const items: MediaItem[] = [
    ...(PHOTOBOOKS as PhotoBook[]).map(book => ({ kind: "photobook" as const, date: book.releaseDate, key: `photobook-${book.id}`, value: book })),
    ...(MAGAZINES as Magazine[]).map((magazine, index) => ({ kind: "magazine" as const, date: magazine.publicationDate ?? "", key: `magazine-${magazine.id ?? index}`, value: magazine })),
    ...(NOTES as Note[]).map((note, index) => ({ kind: "article" as const, date: note.date ?? "", key: `article-${note.title.en}-${index}`, value: note })),
  ].sort((a, b) => b.date.localeCompare(a.date))
  const visible = filter === "all" ? items : items.filter(item => item.kind === filter)
  const filters: { value: MediaFilter; label: string }[] = [
    { value: "all", label: t.media_filter_all },
    { value: "photobook", label: t.media_filter_photobooks },
    { value: "magazine", label: t.media_filter_magazines },
    { value: "article", label: t.media_filter_articles },
  ]

  return <ArchiveCatalog title={t.media} backLabel={t.back_to_museum}>
    <CatalogFilterBar<MediaFilter> label={t.media_filter_label} options={filters} value={filter} onChange={setFilter} />
    {filter === "photobook" && <p className="text-xs leading-6 text-coco-ink/55">{t.photobooks_introduction}</p>}
    <p role="status" className="text-xs text-coco-ink/50">{t.media_count.replace("{count}", String(visible.length))}</p>
    <CatalogGrid>
      {visible.map(item => {
        if (item.kind === "photobook") return <PhotoBookEntry key={item.key} book={item.value} lang={lang} />
        if (item.kind === "magazine") return <MagazineEntry key={item.key} entry={item.value} lang={lang} />
        return <NoteEntry key={item.key} note={item.value} lang={lang} />
      })}
    </CatalogGrid>
  </ArchiveCatalog>
}
