import DATA from "../data/archived-accounts.yaml"
import type { ArchivedAccount, Language } from "../types"
import { TRANSLATIONS } from "../i18n"
import { ArchiveCatalog, CatalogGrid } from "../components/ArchiveCatalog"
import ArchivedAccountEntry from "../components/ArchivedAccountEntry"

export default function ArchivedAccounts({ lang }: { lang: Language }) {
  const t = TRANSLATIONS[lang]
  const accounts = DATA as ArchivedAccount[]
  return <ArchiveCatalog title={t.archived_accounts} backLabel={t.back_to_museum}>
    <p role="status" className="text-xs text-coco-ink/50">{t.archived_accounts_count.replace("{count}", String(accounts.length))}</p>
    {accounts.length > 0 ? <CatalogGrid>{accounts.map((account, index) =>
      <ArchivedAccountEntry key={account.id ?? `${account.url}-${index}`} account={account} lang={lang} />
    )}</CatalogGrid> : <p className="text-sm text-coco-ink/60">{t.archived_accounts_empty}</p>}
  </ArchiveCatalog>
}
