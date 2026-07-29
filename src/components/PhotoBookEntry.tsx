import { ArrowUpRight, BookOpen } from "lucide-react"
import { TRANSLATIONS } from "../i18n"
import type { Language, PhotoBook } from "../types"
import ExternalAnchor from "./ExternalAnchor"

function formatReleaseDate(date: string, lang: Language) {
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
    <article
      aria-labelledby={headingId}
      className="grid gap-10 border-b grid-line pb-20 md:grid-cols-[minmax(220px,0.72fr)_minmax(0,1.7fr)] md:gap-12 lg:gap-16"
    >
      <figure className="self-start md:sticky md:top-28">
        <div className="aspect-210/297 overflow-hidden rounded-sm border grid-line bg-coco-ink/5 shadow-[0_24px_60px_rgba(0,0,0,0.12)]">
          {book.cover ? (
            <img
              src={book.cover.url}
              alt={book.cover.alt[lang]}
              className="h-full w-full object-contain"
              decoding="async"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-coco-ink/25">
              <BookOpen className="h-12 w-12" aria-hidden="true" />
              <span className="text-[10px] font-bold uppercase tracking-[0.25em]">
                {t.photobook_cover_unavailable}
              </span>
            </div>
          )}
        </div>
        {book.cover && (
          <figcaption className="mt-4 text-[10px] leading-5 text-coco-ink/35">
            {t.photobook_cover_notice}{" "}
            <ExternalAnchor
              href={book.cover.sourceUrl}
              className="underline decoration-coco-ink/20 underline-offset-4 transition-colors hover:text-coco-accent"
            >
              {t.photobook_cover_source}
            </ExternalAnchor>
          </figcaption>
        )}
      </figure>

      <div className="min-w-0">
        <time
          dateTime={book.releaseDate}
          className="mb-5 block text-xs tracking-[0.2em] text-coco-accent"
        >
          {book.releaseDate.replaceAll("-", ".")}
        </time>
        <h2
          id={headingId}
          className="wrap-break-words text-4xl font-serif leading-tight md:text-5xl"
        >
          {book.title[lang]}
        </h2>
        {book.subtitle && (
          <p className="mt-4 text-sm leading-7 text-coco-ink/50">
            {book.subtitle[lang]}
          </p>
        )}

        <div className="my-10 h-px w-16 bg-coco-accent" />

        <p className="whitespace-pre-line text-base leading-8 text-coco-ink/70">
          {book.description[lang]}
        </p>

        <dl className="mt-10 grid grid-cols-1 border-t grid-line sm:grid-cols-2">
          {details.map(([label, value]) => (
            <div
              key={label}
              className="border-b grid-line py-4 sm:odd:pr-6 sm:even:pl-6 sm:even:border-l"
            >
              <dt className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-coco-ink/35">
                {label}
              </dt>
              <dd className="wrap-break-words text-sm leading-6 text-coco-ink/75">
                {value}
              </dd>
            </div>
          ))}
        </dl>

        {book.links.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-3">
            {book.links.map((link) => (
              <ExternalAnchor
                key={link.url}
                href={link.url}
                className="inline-flex items-center gap-2 rounded-full border grid-line px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors hover:border-coco-accent hover:text-coco-accent"
              >
                {link.label[lang]}
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </ExternalAnchor>
            ))}
          </div>
        )}
      </div>
    </article>
  )
}
