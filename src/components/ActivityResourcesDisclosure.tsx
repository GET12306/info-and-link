import { activityResources } from "../data/activityResources"
import type { Language } from "../types"
import { filterActivityResources } from "../utils/activityResources"
import RelatedResourcesDisclosure from "./RelatedResourcesDisclosure"

export default function ActivityResourcesDisclosure({ activityId, lang }: { activityId: string; lang: Language }) {
  const resources = filterActivityResources(activityResources, activityId)
  return <RelatedResourcesDisclosure resources={resources} lang={lang} />
}
