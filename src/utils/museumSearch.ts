import type {
  Activity,
  Credit,
  DailyPost,
  Language,
  Magazine,
  Note,
  PhotoBook,
  ProgramArchiveEntry,
} from "../types"
import { getActivityVenueText } from "../data/venues"
import { getActivityOccurrences } from "./activitySchedule"
import { localizedText } from "./localizedText"
import { ACTIVITY_CATEGORY_META } from "../config/activityCategories"

export type MuseumCollection = "credits" | "activities" | "programs" | "media" | "daily-posts"

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

export interface MuseumSearchSources {
  credits: Credit[]
  activities: Activity[]
  programs: ProgramArchiveEntry[]
  photobooks: PhotoBook[]
  magazines: Magazine[]
  notes: Note[]
  dailyPosts: DailyPost[]
}

const CREDIT_MEDIUM_SEARCH_TERMS: Record<Credit["medium"], string> = {
  anime: "anime アニメ",
  game: "game games ゲーム",
  film: "film movie 映画",
  television: "television tv テレビ",
  audio: "audio voice 音声",
  other: "other その他",
}

function searchable(values: unknown[]) {
  return values.flatMap((value) => {
    if (typeof value === "string") return [value]
    if (value && typeof value === "object") {
      const localized = value as Partial<Record<Language, string>>
      return [localized.ja, localized.en].filter((text): text is string => typeof text === "string")
    }
    return []
  }).join(" ").normalize("NFKC").toLocaleLowerCase()
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

function itemSortDate(item: MuseumSearchItem) {
  return [...item.dates].sort().at(-1) ?? ""
}

export function buildMuseumSearchItems(sources: MuseumSearchSources, lang: Language): MuseumSearchItem[] {
  const items: MuseumSearchItem[] = [
    ...sources.credits.map((credit) => ({
      id: `credit-${credit.id}`,
      collection: "credits" as const,
      title: credit.title[lang],
      description: credit.role?.[lang] || credit.notes?.[lang],
      dateLabel: credit.year,
      dates: expandMuseumDate(credit.year),
      href: credit.links?.find((link) => link.status !== "expired")?.url,
      path: "/museum/credits",
      searchText: searchable([credit.title, credit.role, credit.notes, CREDIT_MEDIUM_SEARCH_TERMS[credit.medium]]),
    })),
    ...sources.activities.map((activity) => ({
      id: `activity-${activity.id}`,
      collection: "activities" as const,
      title: activity.title[lang],
      description: activity.description?.[lang] || getActivityVenueText(activity, lang),
      dateLabel: activity.scheduleLabel,
      dates: [...new Set(getActivityOccurrences(activity).map((occurrence) => occurrence.date))],
      href: activity.link,
      path: "/museum/activities",
      searchText: searchable([
        activity.title,
        activity.description,
        getActivityVenueText(activity, "ja"),
        getActivityVenueText(activity, "en"),
        activity.scheduleLabel,
        activity.category,
        ACTIVITY_CATEGORY_META[activity.category].compactLabel,
      ]),
    })),
    ...sources.programs.map((program, index) => ({
      id: `program-${index}-${program.date}`,
      collection: "programs" as const,
      title: program.title[lang],
      description: program.description?.[lang],
      dateLabel: program.date,
      dates: expandMuseumDate(program.date),
      href: program.status === "expired" ? undefined : program.url,
      path: "/museum/programs",
      searchText: searchable([program.title, program.description, program.date, "program show 番組 企画"]),
    })),
    ...sources.photobooks.map((book) => ({
      id: `photobook-${book.id}`,
      collection: "media" as const,
      title: book.title[lang],
      description: book.subtitle?.[lang] || book.description[lang],
      dateLabel: book.releaseDate,
      dates: expandMuseumDate(book.releaseDate),
      href: book.links[0]?.url,
      path: "/museum/media",
      searchText: searchable([
        book.title,
        book.subtitle,
        book.description,
        book.photographer,
        book.publisher,
        book.distributor,
        book.isbn,
        "photobook 写真集",
      ]),
    })),
    ...sources.magazines.map((magazine, index) => ({
      id: `magazine-${magazine.id ?? index}`,
      collection: "media" as const,
      title: localizedText(magazine.title, lang),
      description: localizedText(magazine.feature, lang) || localizedText(magazine.notes, lang),
      dateLabel: magazine.publicationDate,
      dates: expandMuseumDate(magazine.publicationDate),
      href: magazine.links?.find((link) => link.status !== "expired")?.url,
      path: "/museum/media",
      searchText: searchable([
        magazine.title,
        magazine.issue,
        magazine.publisher,
        magazine.feature,
        magazine.pages,
        magazine.notes,
        "magazine 雑誌",
      ]),
    })),
    ...sources.notes.map((note, index) => ({
      id: `note-${index}-${note.date ?? "undated"}`,
      collection: "media" as const,
      title: note.title[lang],
      description: note.description?.[lang],
      dateLabel: note.date,
      dates: expandMuseumDate(note.date),
      href: note.status === "expired" ? undefined : note.link,
      path: "/museum/media",
      searchText: searchable([note.title, note.category, note.description, "article interview 記事 インタビュー"]),
    })),
    ...sources.dailyPosts.map((post, index) => ({
      id: `daily-post-${post.id ?? index}`,
      collection: "daily-posts" as const,
      title: localizedText(post.title, lang),
      description: localizedText(post.description, lang),
      dateLabel: post.date,
      dates: expandMuseumDate(post.date),
      href: post.status === "expired" ? undefined : post.url,
      path: "/museum/daily-posts",
      searchText: searchable([post.title, post.description, ...(post.tags ?? []), post.platform, "daily everyday 日常 投稿"]),
    })),
  ]

  return items.sort((a, b) =>
    itemSortDate(b).localeCompare(itemSortDate(a)) || a.title.localeCompare(b.title, lang)
  )
}
