import { TRANSLATIONS } from "../i18n"
import HISTORICAL_RESOURCES from "../data/historical-resources.yaml"
import type { HistoricalResource, Language } from "../types"
import EmptyState from "../components/EmptyState"
import ExternalAnchor from "../components/ExternalAnchor"
import { PageHeader, PageLayout } from "../components/PageLayout"

const statusClassNames = {
  available: "bg-coco-accent/10 text-coco-accent",
  expired: "bg-coco-ink/5 text-coco-ink/45 dark:bg-white/10",
}

export default function HistoricalResources({ lang }: { lang: Language }) {
  const t = TRANSLATIONS[lang]
  const resources = HISTORICAL_RESOURCES as HistoricalResource[]

  return (
    <PageLayout>
      <PageHeader
        title={t.historical_resources}
        subtitle={t.historical_resources_subtitle}
      />

      {resources.length > 0 ? (
        <div className="divide-y divide-gray-300 border-t grid-line dark:divide-white/10">
          {resources.map((item, index) => (
            <article
              key={`${item.date}-${index}`}
              className="flex flex-col gap-4 py-6 md:flex-row md:items-start"
            >
              <div className="font-mono text-sm text-coco-ink/40 md:w-32">{item.date}</div>

              <div className="flex-1">
                <div className="mb-1 text-[10px] uppercase tracking-widest">
                  <span className={`inline-flex w-fit rounded px-2 py-1 font-bold ${statusClassNames[item.status]}`}>
                    {item.status === "available" ? t.resource_available : t.resource_expired}
                  </span>
                </div>
                {item.url ? (
                  <ExternalAnchor
                    href={item.url}
                    className="mb-1 inline-block text-xl font-serif leading-relaxed transition-colors hover:text-coco-accent"
                  >
                    {item.title[lang]}
                  </ExternalAnchor>
                ) : (
                  <div className="mb-1 text-xl font-serif">{item.title[lang]}</div>
                )}

                {item.description && (
                  <div className="text-sm text-coco-ink/60">{item.description[lang]}</div>
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
