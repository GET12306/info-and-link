import VENUE_DOCUMENT from "./venues.yaml"
import type { Activity, Language, LocalizedText, Venue } from "../types"

interface VenueDocument {
  defaults: {
    countryCode: string
    timeZone: string
  }
  venues: Array<Omit<Venue, "countryCode" | "timeZone"> & {
    countryCode?: string
    timeZone?: string
  }>
}

const document = VENUE_DOCUMENT as VenueDocument

export const VENUES: Venue[] = document.venues.map((venue) => ({
  ...venue,
  countryCode: venue.countryCode ?? document.defaults.countryCode,
  timeZone: venue.timeZone ?? document.defaults.timeZone,
}))

export const VENUES_BY_ID = new Map(VENUES.map((venue) => [venue.id, venue]))

export function getVenue(id: string) {
  return VENUES_BY_ID.get(id)
}

export function getActivityVenues(activity: Pick<Activity, "venueIds">) {
  return (activity.venueIds ?? []).map(getVenue).filter((venue): venue is Venue => Boolean(venue))
}

function localized(value: LocalizedText | undefined, lang: Language) {
  return value?.[lang] || value?.ja || value?.en || ""
}

export function getVenueName(venue: Venue, lang: Language) {
  return localized(venue.name, lang)
}

export function getVenueAddress(venue: Venue, lang: Language) {
  const address = venue.address
  const parts = [
    address.postalCode ? (lang === "ja" ? `〒${address.postalCode}` : address.postalCode) : "",
    localized(address.region, lang),
    localized(address.locality, lang),
    localized(address.street, lang),
  ].filter(Boolean)
  return parts.join(lang === "ja" ? "" : ", ")
}

export function getVenueNavigationText(venue: Venue) {
  return [venue.name.ja || venue.name.en, getVenueAddress(venue, "ja")]
    .filter(Boolean)
    .join(" ")
}

export function getVenueMapUrl(venue: Venue) {
  const query = encodeURIComponent(getVenueNavigationText(venue))
  return `https://www.google.com/maps/search/?api=1&query=${query}`
}

export function getActivityVenueText(activity: Pick<Activity, "venueIds" | "venueNote">, lang: Language) {
  const names = getActivityVenues(activity).map((venue) => getVenueName(venue, lang))
  const note = localized(activity.venueNote, lang)
  return [...names, note].filter(Boolean).join(" / ")
}

export function getActivityCalendarLocation(
  activity: Pick<Activity, "venueIds" | "venueNote">,
  lang: Language
) {
  const venues = getActivityVenues(activity)
  if (venues.length === 1) {
    return [getVenueName(venues[0], lang), getVenueAddress(venues[0], lang)]
      .filter(Boolean)
      .join(" — ")
  }
  return getActivityVenueText(activity, lang)
}
