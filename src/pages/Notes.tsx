import { TRANSLATIONS } from "../i18n"
import NOTES from "../data/notes.yaml"
import type { Language, Note } from "../types"
import EmptyState from "../components/EmptyState"
import ExternalAnchor from "../components/ExternalAnchor"
import { PageHeader, PageLayout } from "../components/PageLayout"

export default function Notes({ lang }: { lang: Language }) {
  const t = TRANSLATIONS[lang]
  const notes = NOTES as Note[]

  return (
    <PageLayout>
      <PageHeader title={t.notes} subtitle={t.notes_subtitle} />

      {notes.length > 0 ? (
        <div className="divide-y divide-gray-300 border-t grid-line dark:divide-white/10">
          {notes.map((note, index) => (
            <article
              key={`${note.title.en}-${index}`}
              className="flex flex-col gap-4 py-6 md:flex-row md:items-start"
            >
              {note.date ? (
                <div className="font-mono text-sm text-coco-ink/40 md:w-32 md:shrink-0">
                  {note.date}
                </div>
              ) : (
                <div aria-hidden="true" className="hidden md:block md:w-32 md:shrink-0" />
              )}

              <div className="flex-1">
                {note.category && (
                  <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-coco-ink/40">
                    {note.category[lang]}
                  </div>
                )}

                {note.link ? (
                  <ExternalAnchor
                    href={note.link}
                    className="mb-1 inline-block text-xl font-serif leading-relaxed transition-colors hover:text-coco-accent"
                  >
                    {note.title[lang]}
                  </ExternalAnchor>
                ) : (
                  <div className="mb-1 text-xl font-serif leading-relaxed">
                    {note.title[lang]}
                  </div>
                )}

                {note.description && (
                  <div className="text-sm leading-relaxed text-coco-ink/60">
                    {note.description[lang]}
                  </div>
                )}

                {note.relatedLinks && note.relatedLinks.length > 0 && (
                  <div className="mt-4 border-l border-coco-ink/15 pl-4 dark:border-white/15">
                    <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-coco-ink/35">
                      {t.related_links}
                    </div>
                    <ul className="space-y-2">
                      {note.relatedLinks.map((relatedLink, relatedIndex) => (
                        <li
                          key={`${relatedLink.url}-${relatedIndex}`}
                          className="flex flex-col items-start gap-0.5 text-sm sm:flex-row sm:gap-3"
                        >
                          {relatedLink.type && (
                            <span className="shrink-0 text-[10px] font-bold uppercase tracking-widest text-coco-ink/35 sm:pt-0.5">
                              {relatedLink.type[lang]}
                            </span>
                          )}
                          <ExternalAnchor
                            href={relatedLink.url}
                            className="min-w-0 break-words leading-relaxed text-coco-ink/60 transition-colors hover:text-coco-accent"
                          >
                            {relatedLink.title?.[lang] ?? relatedLink.url}
                          </ExternalAnchor>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState title={t.coming_soon} />
      )}
    </PageLayout>
  )
}
