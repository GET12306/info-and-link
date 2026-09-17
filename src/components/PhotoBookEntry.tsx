import { CatalogEntry, CatalogEntryTitle, CatalogDisclosure } from "./ArchiveCatalog"
import { ArrowUpRight, BookOpen } from "lucide-react"
import { TRANSLATIONS } from "../i18n"
import type { Language, PhotoBook } from "../types"
import ExternalAnchor from "./ExternalAnchor"
import RelatedResourcesDisclosure from "./RelatedResourcesDisclosure"

function formatReleaseDate(date: string, lang: Language) {
  if (/^\d{4}$/.test(date)) return lang === "ja" ? `${date}年` : date
  if (/^\d{4}-\d{2}$/.test(date)) {
    const [year, month] = date.split("-").map(Number)
    return new Intl.DateTimeFormat(lang === "ja" ? "ja-JP" : "en-US", {
      year: "numeric",
      month: "long",
      timeZone: "Asia/Tokyo",
    }).format(new Date(Date.UTC(year, month - 1, 1)))
  }
  return new Intl.DateTimeFormat(lang === "ja" ? "ja-JP" : "en-US", {
    dateStyle: "long",
    timeZone: "Asia/Tokyo",
  }).format(new Date(`${date}T00:00:00+09:00`))
}

export default function PhotoBookEntry({
  book,
  lang,
}: {
  book: PhotoBook
  lang: Language
}) {
  const t = TRANSLATIONS[lang]
  const headingId = `photobook-${book.id}`
  const details = [
    [t.photobook_release_date, formatReleaseDate(book.releaseDate, lang)],
    [t.photobook_photographer, book.photographer],
    [t.photobook_publisher, book.publisher],
    [t.photobook_distributor, book.distributor],
    [t.photobook_format, book.format?.[lang]],
    [t.photobook_isbn, book.isbn],
    [t.photobook_price, book.price?.[lang]],
  ].filter((detail): detail is [string, string] => Boolean(detail[1]))

  return (
    <CatalogEntry>
      <div className="flex items-start gap-4">
      <figure className="w-20 shrink-0 sm:w-24">
        <div className="aspect-210/297 overflow-hidden rounded-sm border grid-line bg-coco-ink/5 ">
          {book.cover ? (
            <img
              src={book.cover.url}
              alt={book.cover.alt[lang]}
              className="h-full w-full object-contain"
              decoding="async"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-coco-ink/25">
              <BookOpen className="h-6 w-6" aria-hidden="true" />
              <span className="text-[10px] font-bold ">
                {t.photobook_cover_unavailable}
              </span>
            </div>
          )}
        </div>
        {book.cover && (
          <figcaption className="mt-2 text-[10px] leading-4 text-coco-ink/35">
            {t.photobook_cover_notice}{" "}
            <ExternalAnchor
              href={book.cover.sourceUrl}
              className="transition-colors hover:text-coco-accent"
            >
              {t.photobook_cover_source}
            </ExternalAnchor>
          </figcaption>
        )}
      </figure>

      <div className="min-w-0 flex-1">
        <time
          dateTime={book.releaseDate}
          className="mb-1 block text-xs text-coco-ink/50"
        >
          {book.releaseDate.replaceAll("-", ".")}
        </time>
        <CatalogEntryTitle id={headingId}>{book.title[lang]}</CatalogEntryTitle>
        {book.subtitle && (
          <p className="mt-2 text-xs leading-5 text-coco-ink/50">
            {book.subtitle[lang]}
          </p>
        )}

        <dl className="mt-3 grid grid-cols-1">
          {details.map(([label, value]) => (
            <div
              key={label}
              className="py-1"
            >
              <dt className="text-[10px] text-coco-ink/35">
                {label}
              </dt>
              <dd className="wrap-break-words text-xs leading-5 text-coco-ink/75">
                {value}
              </dd>
            </div>
          ))}
        </dl>
        <CatalogDisclosure label={t.photobook_details}>
          <p className="whitespace-pre-line text-sm leading-6 text-coco-ink/70">{book.description[lang]}</p>
        </CatalogDisclosure>

        {book.links.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {book.links.map((link) => (
              <ExternalAnchor
                key={link.url}
                href={link.url}
                className="inline-flex items-center gap-2 rounded-full border grid-line px-3 py-2 text-xs font-bold uppercase tracking-wider transition-colors hover:border-coco-accent hover:text-coco-accent"
              >
                {link.label[lang]}
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </ExternalAnchor>
            ))}
          </div>
        )}
        <RelatedResourcesDisclosure resources={book.relatedResources} lang={lang} />
      </div>
      </div>
    </CatalogEntry>
  )
}
