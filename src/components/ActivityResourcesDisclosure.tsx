import { useId, useState } from "react"
import { Files } from "lucide-react"
import { activityResources } from "../data/activityResources"
import type { Language } from "../types"
import { filterActivityResources, groupEpisodeResources } from "../utils/activityResources"
import { RelatedResourcesList } from "./RelatedResourcesDisclosure"
import ACTIVITIES from "../data/activities"
import { programEpisodeLabel } from "../utils/programEpisodes"
import { TRANSLATIONS } from "../i18n"
import { CatalogDisclosure } from "./ArchiveCatalog"
import ActivityDisclosureButton from "./ActivityDisclosureButton"

export default function ActivityResourcesDisclosure({ activityId, lang, performance, variant = "catalog" }: {
  activityId: string
  lang: Language
  performance?: string
  variant?: "catalog" | "activity"
}) {
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const resources = filterActivityResources(activityResources, activityId).filter(item => performance === undefined || item.performance === performance)
  if (resources.length === 0) return null
  const t = TRANSLATIONS[lang]
  const activity = ACTIVITIES.find(item => item.id === activityId)
  const grouped = performance === undefined && resources.some(item => item.performance)
  const groups = grouped ? groupEpisodeResources(resources, activity) : []
  const count = resources.reduce((total, item) => total + item.links.length, 0)
  const content = grouped ? groups.map(group => group.key ? <CatalogDisclosure key={group.key} nested label={group.performance
      ? `${group.key.slice(0, 10)} · ${programEpisodeLabel(group.performance, lang)}` : group.key}>
      <RelatedResourcesList resources={group.resources} lang={lang} />
    </CatalogDisclosure> : <RelatedResourcesList key="general" resources={group.resources} lang={lang} />)
    : <RelatedResourcesList resources={resources} lang={lang} />

  if (variant === "activity") return <div className="mt-3">
    <ActivityDisclosureButton
      label={t.related_resources}
      icon={<Files className="h-3.5 w-3.5" aria-hidden="true" />}
      count={count}
      open={open}
      panelId={panelId}
      onClick={() => setOpen(!open)}
    />
    <div id={panelId} hidden={!open} className="mt-3">{content}</div>
  </div>

  return <CatalogDisclosure label={t.related_resources_link.replace("{count}", String(count))}>
    {content}
  </CatalogDisclosure>
}
