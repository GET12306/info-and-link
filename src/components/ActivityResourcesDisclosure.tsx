import { activityResources } from "../data/activityResources"
import type { Language } from "../types"
import RelatedResourcesDisclosure from "./RelatedResourcesDisclosure"

export default function ActivityResourcesDisclosure({ activityId, lang }: { activityId: string; lang: Language }) {
  const resources = activityResources
    .filter(resource => resource.activityId === activityId)
  return <RelatedResourcesDisclosure resources={resources} lang={lang} />
}
