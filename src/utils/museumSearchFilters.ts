export type MuseumCollection = "credits" | "activities" | "programs" | "media" | "daily-posts" | "accounts"

export interface MuseumSearchItem {
  id: string
  collection: MuseumCollection
  title: string
  description?: string
  dateLabel?: string
  dates: string[]
  href?: string
  path: string
  searchText: string
}

function normalizeExplicitDate(value: string) {
  return value.trim().replace(/[./]/g, "-")
}

/** Turn the partial and range dates used by archive YAML into searchable date keys. */
export function expandMuseumDate(value?: string): string[] {
  if (!value) return []
  const compactMonthRange = value.trim().match(/^(\d{4})[./](\d{2})-(\d{2})$/)
  if (compactMonthRange) {
    const start = Number(compactMonthRange[2])
    const end = Number(compactMonthRange[3])
    if (start >= 1 && end <= 12 && end >= start) {
      return Array.from(
        { length: end - start + 1 },
        (_, index) => `${compactMonthRange[1]}-${String(start + index).padStart(2, "0")}`
      )
    }
  }
  const normalized = normalizeExplicitDate(value)
  if (/^\d{4}(-\d{2}){0,2}$/.test(normalized)) return [normalized]

  const yearRange = normalized.match(/^(\d{4})-(\d{4})$/)
  if (yearRange) {
    const start = Number(yearRange[1])
    const end = Number(yearRange[2])
    if (end >= start && end - start <= 100) {
      return Array.from({ length: end - start + 1 }, (_, index) => String(start + index))
    }
  }

  return []
}

export function normalizeMuseumDateQuery(value: string): string | null {
  const normalized = normalizeExplicitDate(value)
  if (!normalized) return ""
  const match = normalized.match(/^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?$/)
  if (!match) return null
  const month = match[2] ? Number(match[2]) : null
  const day = match[3] ? Number(match[3]) : null
  if (month !== null && (month < 1 || month > 12)) return null
  if (day !== null) {
    const date = new Date(Date.UTC(Number(match[1]), month! - 1, day))
    if (
      date.getUTCFullYear() !== Number(match[1]) ||
      date.getUTCMonth() !== month! - 1 ||
      date.getUTCDate() !== day
    ) return null
  }
  return normalized
}

function dateMatches(dates: string[], query: string) {
  return dates.some((date) => date === query || date.startsWith(`${query}-`))
}

export function filterMuseumItems(
  items: MuseumSearchItem[],
  query: string,
  collection: "all" | MuseumCollection,
  dateQuery: string
) {
  const needle = query.trim().normalize("NFKC").toLocaleLowerCase()
  return items.filter((item) =>
    (collection === "all" || item.collection === collection) &&
    (!needle || item.searchText.includes(needle)) &&
    (!dateQuery || dateMatches(item.dates, dateQuery))
  )
}

