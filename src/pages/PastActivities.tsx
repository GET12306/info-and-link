import { Link } from "react-router-dom"
import { motion } from "motion/react"
import { ArrowLeft } from "lucide-react"
import { TRANSLATIONS } from "../i18n"
import ACTIVITIES from "../data/activities.yaml"
import type { Activity, Language } from "../types"
import { getPastActivities } from "../utils/activityStatus"

export default function PastActivities({ lang }: { lang: Language }) {
  const t = TRANSLATIONS[lang]
  const pastActivities = getPastActivities(ACTIVITIES as Activity[])

  return (
    <motion.div
      key="past-activities"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4 }}
      className="space-y-20 pb-32"
    >
      <div className="border-b grid-line pb-12 space-y-6">
        <Link
          to="/activities"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-coco-ink/50 hover:text-coco-accent transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t.back_to_activities}
        </Link>

        <div>
          <h1 className="text-5xl md:text-7xl font-serif mb-4">{t.past_activities}</h1>
          <p className="text-coco-ink/50 uppercase tracking-widest text-xs">Archived Activities History</p>
        </div>
      </div>

      {pastActivities.length > 0 ? (
        <div className="border-t grid-line divide-y divide-gray-300 dark:divide-white/10">
          {pastActivities.map((act) => (
            <div
              key={act.originalIndex}
              className="py-6 flex flex-col md:flex-row md:items-start justify-between gap-4"
            >
              <div className="md:w-32 font-mono text-sm text-coco-ink/40">{act.date}</div>
              <a href={act.link} target="_blank" rel="noopener noreferrer" className="flex-1 hover:opacity-80 transition-opacity">
                <div className="text-[10px] opacity-40 uppercase tracking-widest mb-1">{act.category}</div>
                <div className="text-xl font-serif mb-1">{act.title[lang]}</div>
                {act.description && (
                  <div className="text-sm text-coco-ink/60">{act.description[lang]}</div>
                )}
              </a>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center border grid-line bg-white/50 dark:bg-neutral-900/50">
          <p className="text-coco-ink/30 font-serif text-3xl">{t.no_past_activities}</p>
        </div>
      )}
    </motion.div>
  )
}
