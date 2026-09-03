import { TRANSLATIONS } from "../i18n"
import type { Language } from "../types"

export default function ExpiredLinkBadge({ lang }: { lang: Language }) {
  return (
    <span className="inline-flex w-fit rounded bg-coco-ink/5 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-coco-ink/45 dark:bg-white/10">
      {TRANSLATIONS[lang].resource_expired}
    </span>
  )
}
