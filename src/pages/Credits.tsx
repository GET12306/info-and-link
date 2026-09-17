import { useState } from "react"
import CREDITS from "../data/credits.yaml"
import type { Credit, CreditMedium, Language } from "../types"
import { TRANSLATIONS } from "../i18n"
import { ArchiveCatalog, CatalogEntry, CatalogEntryTitle, CatalogFilterBar, CatalogGrid, CatalogTextLink } from "../components/ArchiveCatalog"
import ExpiredLinkBadge from "../components/ExpiredLinkBadge"

type CreditFilter = "all" | CreditMedium

export default function Credits({ lang }: { lang: Language }) {
  const t = TRANSLATIONS[lang]
  const [filter, setFilter] = useState<CreditFilter>("all")
  const credits = [...(CREDITS as Credit[])].sort((a, b) => b.year.localeCompare(a.year))
  const visible = filter === "all" ? credits : credits.filter(credit => credit.medium === filter)
  const filters: { value: CreditFilter; label: string }[] = ["all", "anime", "game", "film", "television", "audio", "other"]
    .map(value => ({ value: value as CreditFilter, label: t[`credits_filter_${value}`] }))

  return <ArchiveCatalog title={t.credits} backLabel={t.back_to_museum}>
    <CatalogFilterBar<CreditFilter> label={t.credits_filter_label} options={filters} value={filter} onChange={setFilter} />
    <p role="status" className="text-xs text-coco-ink/50">{t.credits_count.replace("{count}", String(visible.length))}</p>
    <CatalogGrid>
      {visible.map(credit => <CatalogEntry key={credit.id}>
        <div className="mb-2 flex flex-wrap items-center gap-3 text-xs text-coco-ink/50">
          <span>{credit.year}</span>
          <span>{t[`credits_filter_${credit.medium}`]}</span>
          {credit.verification === "needs-review" && <span>{t.credits_needs_review}</span>}
        </div>
        <CatalogEntryTitle>{credit.title[lang]}</CatalogEntryTitle>
        {credit.role && <p className="mt-2 text-sm leading-6 text-coco-ink/70">{credit.role[lang]}</p>}
        {credit.notes && <p className="mt-1 text-xs leading-5 text-coco-ink/55">{credit.notes[lang]}</p>}
        {!!credit.links?.length && <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">{credit.links.map((link, index) => <li key={`${link.url}-${index}`} className="flex items-center gap-2 text-xs">
          <CatalogTextLink href={link.url}>{link.label?.[lang] ?? t.credits_link}</CatalogTextLink>
          {link.status === "expired" && <ExpiredLinkBadge lang={lang} />}
        </li>)}</ul>}
      </CatalogEntry>)}
    </CatalogGrid>
  </ArchiveCatalog>
}
