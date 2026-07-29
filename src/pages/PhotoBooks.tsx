import { BookOpen } from "lucide-react"
import PHOTOBOOKS_DATA from "../data/photobooks.yaml"
import EmptyState from "../components/EmptyState"
import PhotoBookEntry from "../components/PhotoBookEntry"
import { PageHeader, PageLayout } from "../components/PageLayout"
import { TRANSLATIONS } from "../i18n"
import type { Language, PhotoBook } from "../types"

export default function PhotoBooks({ lang }: { lang: Language }) {
  const t = TRANSLATIONS[lang]
  const books = PHOTOBOOKS_DATA as PhotoBook[]

  return (
    <PageLayout compact>
      <PageHeader title={t.photobooks}>
        <p className="mt-6 max-w-2xl text-sm leading-7 text-coco-ink/55">
          {t.photobooks_introduction}
        </p>
      </PageHeader>
        <section
          aria-label={t.photobooks}
          className="space-y-20"
        >
          {books.map((book) => (
            <PhotoBookEntry key={book.id} book={book} lang={lang} />
          ))}
        </section>
    </PageLayout>
  )
}
