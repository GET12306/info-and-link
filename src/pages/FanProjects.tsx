import { motion } from "motion/react"
import { Users, ArrowRight, ExternalLink } from "lucide-react"
import { TRANSLATIONS } from "../i18n"
import FAN_PROJECTS from "../data/fan-projects.yaml"
import type { Language } from "../types"

export default function FanProjects({ lang }: { lang: Language }) {
  const t = TRANSLATIONS[lang]

  return (
    <motion.div
      key="fan"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4 }}
      className="space-y-20 pb-32"
    >
      <div className="border-b grid-line pb-12">
        <h1 className="text-5xl md:text-7xl font-serif mb-4">{t.fan_projects}</h1>
        <p className="text-coco-ink/50 uppercase tracking-widest text-xs">Community Support & Activity</p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {(FAN_PROJECTS as any[]).length > 0 ? (
          (FAN_PROJECTS as any[]).map((project: any, i: number) => (
            <div key={i} className="p-8 border grid-line bg-white hover:border-coco-accent transition-colors group dark:bg-neutral-900">
              <div className="flex flex-col md:flex-row justify-between gap-6">
                <div className="space-y-4 flex-1">
                  <div className="flex items-center gap-2 text-coco-accent text-[10px] font-bold uppercase tracking-widest">
                    <Users className="w-3 h-3" />
                    {t.fan_projects}
                  </div>
                  <h3 className="text-2xl font-serif">{project.title[lang]}</h3>
                  <p className="text-coco-ink/60 leading-relaxed max-w-2xl">{project.description[lang]}</p>

                  <div className="flex items-center gap-4 pt-4 text-xs">
                    <span className="opacity-40">{t.organizer}:</span>
                    {project.organizerUrl ? (
                      <a href={project.organizerUrl} target="_blank" rel="noopener" className="font-bold hover:text-coco-accent flex items-center gap-1 underline underline-offset-4">
                        {project.organizer}
                        <ArrowRight className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="font-bold">{project.organizer}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-end">
                  <motion.a
                    href={project.url}
                    target="_blank"
                    rel="noopener"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-coco-black text-white px-6 py-3 text-xs font-bold uppercase tracking-widest rounded flex items-center gap-2 group-hover:bg-coco-accent transition-colors dark:bg-white dark:text-black"
                  >
                    {lang === "ja" ? "詳細" : "Details"}
                    <ExternalLink className="w-4 h-4" />
                  </motion.a>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-20 text-center border grid-line bg-white/50 dark:bg-neutral-900/50">
            <p className="text-coco-ink/30 font-serif text-3xl">{t.coming_soon}</p>
          </div>
        )}
      </div>
    </motion.div>
  )
}
