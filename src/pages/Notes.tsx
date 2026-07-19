import { motion } from "motion/react"
import { TRANSLATIONS } from "../i18n"
import NOTES from "../data/notes.yaml"
import type { Language, Note } from "../types"

export default function Notes({ lang }: { lang: Language }) {
  const t = TRANSLATIONS[lang]
  const notes = NOTES as Note[]

  return (
    <motion.div
      key="notes"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4 }}
      className="space-y-20 pb-32"
    >
      <div className="border-b grid-line pb-12">
        <h1 className="text-5xl md:text-7xl font-serif mb-4">{t.notes}</h1>
        <p className="text-coco-ink/50 uppercase tracking-widest text-xs">
          {t.notes_subtitle}
        </p>
      </div>

      <div className="border-t grid-line divide-y divide-gray-300 dark:divide-white/10">
        {notes.map((note, index) => (
          <article
            key={`${note.title.en}-${index}`}
            className="py-6 flex flex-col md:flex-row md:items-start gap-4"
          >
            {note.date && (
              <div className="md:w-32 md:shrink-0 font-mono text-sm text-coco-ink/40">
                {note.date}
              </div>
            )}
            {!note.date && (
              <div aria-hidden="true" className="hidden md:block md:w-32 md:shrink-0" />
            )}

            <div className="flex-1">
              {note.category && (
                <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-coco-ink/40">
                  {note.category[lang]}
                </div>
              )}

              {note.link ? (
                <a
                  href={note.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-xl font-serif mb-1 leading-relaxed transition-colors hover:text-coco-accent"
                >
                  {note.title[lang]}
                </a>
              ) : (
                <div className="text-xl font-serif mb-1 leading-relaxed">
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
                        <a
                          href={relatedLink.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="min-w-0 break-words leading-relaxed text-coco-ink/60 transition-colors hover:text-coco-accent"
                        >
                          {relatedLink.title?.[lang] ?? relatedLink.url}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
    </motion.div>
  )
}
