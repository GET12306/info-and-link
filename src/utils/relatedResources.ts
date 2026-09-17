import type { Language, RelatedResource, RelatedResourceCollection, RelatedResourceLink } from "../types"
import { archiveText } from "./magazines"

export function isRelatedResourceCollection(resource: RelatedResource): resource is RelatedResourceCollection {
  return "links" in resource && Array.isArray(resource.links)
}

export function relatedResourceLinkCount(resource: RelatedResource) {
  return isRelatedResourceCollection(resource) ? resource.links.length : 1
}

export function resourceLinkDetails(link: string | RelatedResourceLink): RelatedResourceLink {
  return typeof link === "string" ? { url: link } : link
}

/** Unlabeled bulk links remain identifiable without manually translating each one. */
export function resourceLinkLabel(link: string | RelatedResourceLink, lang: Language) {
  const details = resourceLinkDetails(link)
  const label = archiveText(details.label, lang)
  if (label) return label
  try {
    const url = new URL(details.url)
    const host = url.hostname.replace(/^www\./, "")
    if (host === "x.com" || host === "twitter.com") {
      const handle = url.pathname.split("/").filter(Boolean)[0]
      if (handle && handle !== "i") return `@${handle}`
    }
    return host
  } catch {
    return details.url
  }
}
