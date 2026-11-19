import { activityResources } from "../data/activityResources"
import type { Language } from "../types"
import { filterActivityResources, groupEpisodeResources } from "../utils/activityResources"
import RelatedResourcesDisclosure, { RelatedResourcesList } from "./RelatedResourcesDisclosure"
import ACTIVITIES from "../data/activities"
import { programEpisodeLabel } from "../utils/programEpisodes"
import { TRANSLATIONS } from "../i18n"
import { CatalogDisclosure } from "./ArchiveCatalog"

export default function ActivityResourcesDisclosure({ activityId, lang, performance }: { activityId: string; lang: Language; performance?: string }) {
  const resources = filterActivityResources(activityResources, activityId).filter(item => performance === undefined || item.performance === performance)
  if (performance !== undefined || !resources.some(item => item.performance)) return <RelatedResourcesDisclosure resources={resources} lang={lang} />
  const activity = ACTIVITIES.find(item => item.id === activityId)
  const groups = groupEpisodeResources(resources, activity)
  const count = resources.reduce((total, item) => total + item.links.length, 0)
  return <CatalogDisclosure label={TRANSLATIONS[lang].related_resources_link.replace("{count}", String(count))}>
    {groups.map(group => group.key ? <CatalogDisclosure key={group.key} nested label={group.performance
      ? `${group.key.slice(0, 10)} · ${programEpisodeLabel(group.performance, lang)}` : group.key}>
      <RelatedResourcesList resources={group.resources} lang={lang} />
    </CatalogDisclosure> : <RelatedResourcesList key="general" resources={group.resources} lang={lang} />)}
  </CatalogDisclosure>
}
