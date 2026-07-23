import { Users, ArrowRight, ExternalLink as ExternalLinkIcon } from "lucide-react"
import { TRANSLATIONS } from "../i18n"
import FAN_PROJECTS from "../data/fan-projects.yaml"
import type { FanProject, Language } from "../types"
import EmptyState from "../components/EmptyState"
import ExternalAnchor from "../components/ExternalAnchor"
import { PageHeader, PageLayout } from "../components/PageLayout"

export default function FanProjects({ lang }: { lang: Language }) {
  const t = TRANSLATIONS[lang]
  const projects = FAN_PROJECTS as FanProject[]

  return (
    <PageLayout>
      <PageHeader title={t.fan_projects} subtitle="Community Support & Activity" />

      <div className="grid grid-cols-1 gap-8">
        {projects.length > 0 ? (
          projects.map((project) => (
            <article key={project.url} className="group border grid-line bg-white p-8 transition-colors hover:border-coco-accent dark:bg-neutral-900">
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
                      <ExternalAnchor href={project.organizerUrl} className="flex items-center gap-1 font-bold underline underline-offset-4 hover:text-coco-accent">
                        {project.organizer}
                        <ArrowRight className="w-3 h-3" />
                      </ExternalAnchor>
                    ) : (
                      <span className="font-bold">{project.organizer}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-end">
                  <ExternalAnchor
                    href={project.url}
                    className="flex items-center gap-2 rounded bg-coco-ink px-6 py-3 text-xs font-bold uppercase tracking-widest text-coco-bg transition-all hover:scale-105 active:scale-95 group-hover:bg-coco-accent group-hover:text-white"
                  >
                    {lang === "ja" ? "詳細" : "Details"}
                    <ExternalLinkIcon className="w-4 h-4" />
                  </ExternalAnchor>
                </div>
              </div>
            </article>
          ))
        ) : (
          <EmptyState title={t.coming_soon} />
        )}
      </div>
    </PageLayout>
  )
}
