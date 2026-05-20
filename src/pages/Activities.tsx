import { motion } from "motion/react"
import { Music, Ticket, Tv, MicVocal, BookOpenText } from "lucide-react"
import { TRANSLATIONS } from "../i18n"
import ACTIVITIES from "../data/activities.yaml"
import type { Language } from "../types"

export default function Activities({ lang }: { lang: Language }) {
  const t = TRANSLATIONS[lang]

  const categories = [
    // sort here
    { id: "Live", name: t.category_live },
    { id: "Musical", name: t.category_musical },
    { id: "Stage", name: t.category_stage },
    { id: "Reading", name: t.category_reading },
    { id: "Program", name: t.category_program },
  ]

  return (
    <motion.div
      key="activities"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4 }}
      className="space-y-20 pb-32"
    >
      <div className="border-b grid-line pb-12">
        <h1 className="text-5xl md:text-7xl font-serif mb-4">{t.activities}</h1>
        <p className="text-coco-ink/50 uppercase tracking-widest text-xs">Performance History & Schedule</p>
      </div>

      {categories.map((cat) => (
        <div key={cat.id} className="space-y-8">
          <h3 className="text-sm uppercase tracking-[0.3em] font-bold text-coco-accent flex items-center gap-3">
            {cat.id === "Musical" && <Music className="w-4 h-4" />}
            {cat.id === "Stage" && <Ticket className="w-4 h-4" />}
            {cat.id === "Program" && <Tv className="w-4 h-4" />}
            {cat.id === "Live" && <MicVocal className="w-4 h-4" />}
            {cat.id === "Reading" && <BookOpenText className="w-4 h-4" />}
            {cat.name}
          </h3>
          <div className="border-t grid-line divide-y grid-line">
            {(ACTIVITIES as any[])
              .filter((a: any) => a.category === cat.id)
              .map((act: any, i: number) => (
                <div key={i} className="py-6 flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="md:w-32 font-mono text-sm text-coco-ink/40">{act.date}</div>
                  <a href={act.link} target="_blank" rel="noopener noreferrer" className="flex-1 hover:opacity-80 transition-opacity">
                    <div className="text-xl font-serif mb-1">{act.title[lang]}</div>
                    {act.description && (
                      <div className="text-sm text-coco-ink/60">{act.description[lang]}</div>
                    )}
                  </a>
                </div>
              ))}
          </div>
        </div>
      ))}
    </motion.div>
  )
}
