import { motion } from "motion/react"
import { TRANSLATIONS } from "../i18n"
import ABOUT_THIS_WEB from "../data/about.yaml"
import type { Language } from "../types"

type LocalizedText = Record<Language, string>

type PolicyLink = {
  label: LocalizedText
  url: string
}

type PolicySection = {
  title: LocalizedText
  body: LocalizedText
  links?: PolicyLink[]
}

type AboutData = {
  site_description: LocalizedText
  policy_sections: PolicySection[]
  contribution: LocalizedText
  last_updated: LocalizedText
}

export default function About({ lang }: { lang: Language }) {
  const t = TRANSLATIONS[lang]
  const about = ABOUT_THIS_WEB as AboutData

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
              {about.site_description[lang]}
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {about.policy_sections.map((section, index) => (
            <section
              key={section.title.en}
              className={`p-8 border grid-line bg-white hover:border-coco-accent transition-colors dark:bg-neutral-900 ${
                about.policy_sections.length % 2 === 1 &&
                index === about.policy_sections.length - 1
                  ? "md:col-span-2"
                  : ""
              }`}
            >
              <h2 className="text-2xl font-serif mb-4">{section.title[lang]}</h2>
              <p className="text-coco-ink/60 leading-relaxed whitespace-pre-wrap">
                {section.body[lang]}
              </p>
              {section.links && section.links.length > 0 && (
                <ul className="mt-5 space-y-2 text-sm">
                  {section.links.map((link) => (
                    <li key={link.url}>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-coco-ink/55 underline decoration-coco-ink/20 underline-offset-4 hover:text-coco-accent"
                      >
                        {link.label[lang]}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        <div className="p-8 border grid-line bg-white hover:border-coco-accent transition-colors dark:bg-neutral-900">
          <h2 className="text-2xl font-serif mb-4">{t.contribution}</h2>
          <div className="text-coco-ink/60 leading-relaxed space-y-4">
            <p className="whitespace-pre-wrap">
              {about.contribution[lang]}
            </p>
          </div>
        </div>

        <p className="text-right text-xs text-coco-ink/40">
          {about.last_updated[lang]}
        </p>
      </div>
    </motion.div>
  )
}
