import { motion } from "motion/react"
import { TRANSLATIONS } from "../i18n"
import ABOUT_THIS_WEB from "../data/about.yaml"
import type { Language } from "../types"

export default function About({ lang }: { lang: Language }) {
  const t = TRANSLATIONS[lang]

  return (
    <motion.div
      key="about"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4 }}
      className="space-y-20 pb-32"
    >
      <div className="border-b grid-line pb-12">
        <h1 className="text-5xl md:text-7xl font-serif mb-4">{t.about_this_site}</h1>
        <p className="text-coco-ink/50 uppercase tracking-widest text-xs">About This Site</p>
      </div>

      <div className="space-y-8">
        <div className="p-8 border grid-line bg-white hover:border-coco-accent transition-colors dark:bg-neutral-900">
          {/* <h2 className="text-2xl font-serif mb-4">{t.about_this_site}</h2> */}
          <div className="text-coco-ink/60 leading-relaxed space-y-4">
            <p className="whitespace-pre-wrap">
              {lang === "ja"
                ? (ABOUT_THIS_WEB as any)["site_description"]["ja"]
                : (ABOUT_THIS_WEB as any)["site_description"]["en"]}
            </p>
          </div>
        </div>

        <div className="p-8 border grid-line bg-white hover:border-coco-accent transition-colors dark:bg-neutral-900">
          <h2 className="text-2xl font-serif mb-4">{t.contribution}</h2>
          <div className="text-coco-ink/60 leading-relaxed space-y-4">
            <p className="whitespace-pre-wrap">
              {lang === "ja"
                ? (ABOUT_THIS_WEB as any)["contribution"]["ja"]
                : (ABOUT_THIS_WEB as any)["contribution"]["en"]}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
