import { ExternalLink } from "lucide-react"
import type { ArchivedAccount, Language } from "../types"
import { localizedText } from "../utils/localizedText"
import { resourceLinkLabel } from "../utils/relatedResources"
import { CatalogEntry, CatalogEntryTitle } from "./ArchiveCatalog"
import ExpiredLinkBadge from "./ExpiredLinkBadge"

export default function ArchivedAccountEntry({ account, lang }: { account: ArchivedAccount; lang: Language }) {
  return <CatalogEntry>
    <div className="mb-2 flex flex-wrap items-center gap-3 text-xs text-coco-ink/50">
      <span>{resourceLinkLabel(account.url, lang)}</span>
      {account.period && <span>{account.period}</span>}
      {account.status === "expired" && <ExpiredLinkBadge lang={lang} />}
    </div>
    <CatalogEntryTitle href={account.url} suffix={<ExternalLink className="mt-1 h-3.5 w-3.5 shrink-0 opacity-45" aria-hidden="true" />}>
      {localizedText(account.title, lang)}
    </CatalogEntryTitle>
    {account.description && <p className="mt-2 whitespace-pre-line text-sm leading-6 text-coco-ink/60">{localizedText(account.description, lang)}</p>}
  </CatalogEntry>
}
