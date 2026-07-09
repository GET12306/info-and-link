import { motion } from "motion/react"
import { TRANSLATIONS } from "../i18n"
import HISTORICAL_RESOURCES from "../data/historical-resources.yaml"
import type { HistoricalResource, Language } from "../types"

const statusClassNames = {
  available: "bg-coco-accent/10 text-coco-accent",
  expired: "bg-coco-ink/5 text-coco-ink/45 dark:bg-white/10",
}

export default function HistoricalResources({ lang }: { lang: Language }) {
  const t = TRANSLATIONS[lang]
  const resources = HISTORICAL_RESOURCES as HistoricalResource[]

  return (
    <motion.div
      key="historical-resources"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4 }}
      className="space-y-20 pb-32"
    >
      <div className="border-b grid-line pb-12">
        <h1 className="text-5xl md:text-7xl font-serif mb-4">{t.historical_resources}</h1>
        <p className="text-coco-ink/50 uppercase tracking-widest text-xs">
          {t.historical_resources_subtitle}
        </p>
      </div>

      <div className="border-t grid-line divide-y divide-gray-300 dark:divide-white/10">
        {resources.map((item, index) => (
          <article
            key={`${item.date}-${index}`}
            className="py-6 flex flex-col md:flex-row md:items-start gap-4"
          >
            <div className="md:w-32 font-mono text-sm text-coco-ink/40">{item.date}</div>

            <div className="flex-1">
              <div className="text-[10px] uppercase tracking-widest mb-1">
                <span className={`inline-flex w-fit px-2 py-1 rounded font-bold ${statusClassNames[item.status]}`}>
                  {item.status === "available" ? t.resource_available : t.resource_expired}
                </span>
              </div>
              {item.url ? (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-xl font-serif mb-1 leading-relaxed transition-colors hover:text-coco-accent"
                >
                  {item.title[lang]}
                </a>
              ) : (
                <div className="text-xl font-serif mb-1">{item.title[lang]}</div>
              )}

              {item.description && (
                <div className="text-sm text-coco-ink/60">{item.description[lang]}</div>
              )}
            </div>
          </article>
        ))}
      </div>
    </motion.div>
  )
}
