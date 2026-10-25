import type {
  Activity,
  ArchivedAccount,
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
import { getActivityDisplaySchedule } from "./activityDisplaySchedule"
import { dateTimeForViewer, viewerTimeZone } from "./timeZone"
import { dailyPostDate, dailyPostLinks, dailyPostPrimaryLink } from "./dailyPosts"
import { localizedText } from "./localizedText"
import { resourceLinkLabel } from "./relatedResources"
import { ACTIVITY_CATEGORY_META } from "../config/activityCategories"
import { getProgramEpisodes, performanceDateKey, programArchivePath, programEpisodeDate, programEpisodeLabel, programEpisodeLink } from "./programEpisodes"

import { expandMuseumDate, type MuseumSearchItem } from "./museumSearchFilters"
export { expandMuseumDate, filterMuseumItems, normalizeMuseumDateQuery } from "./museumSearchFilters"
export type { MuseumCollection, MuseumSearchItem } from "./museumSearchFilters"

export interface MuseumSearchSources {
  credits: Credit[]
  activities: Activity[]
  programs: ProgramArchiveEntry[]
  episodePrograms?: Activity[]
  photobooks: PhotoBook[]
  magazines: Magazine[]
  notes: Note[]
  dailyPosts: DailyPost[]
  accounts: ArchivedAccount[]
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

/** Calculate each latest date once, rather than allocating/sorting dates in every comparison. */
export function sortMuseumSearchItems(items: MuseumSearchItem[], lang: Language): MuseumSearchItem[] {
  return items.map(item => ({ item, date: item.dates.reduce((latest, date) => date > latest ? date : latest, "") }))
    .sort((a, b) => b.date.localeCompare(a.date) || a.item.title.localeCompare(b.item.title, lang))
    .map(({ item }) => item)
}

export function buildMuseumSearchItems(sources: MuseumSearchSources, lang: Language): MuseumSearchItem[] {
  const timeZone = viewerTimeZone()
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
      dateLabel: getActivityDisplaySchedule(activity, timeZone) ?? activity.scheduleLabel,
      dates: [...new Set(getActivityOccurrences(activity).map((occurrence) => occurrence.allDay
        ? occurrence.date : dateTimeForViewer(occurrence.startInstant, timeZone).substring(0, 10)))],
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
    ...(sources.episodePrograms ?? []).flatMap(activity => getProgramEpisodes(activity).map(episode => {
      const dateLabel = programEpisodeDate(episode, activity, timeZone)
      const label = programEpisodeLabel(episode, lang)
      return {
        id: `program-episode-${activity.id}-${performanceDateKey(episode)}`,
        collection: "programs" as const,
        title: `${activity.title[lang]} — ${label}`,
        description: episode.description?.[lang],
        dateLabel: dateLabel.replace("T", " "),
        dates: [dateLabel.substring(0, 10)],
        href: programEpisodeLink(episode),
        path: programArchivePath(activity.id, performanceDateKey(episode)),
        searchText: searchable([activity.title, episode.episode, episode.description, "program episode appearance 番組 出演 回"]),
      }
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
    ...sources.accounts.map((account, index) => ({
      id: `account-${account.id ?? index}`,
      collection: "accounts" as const,
      title: localizedText(account.title, lang),
      description: localizedText(account.description, lang),
      dateLabel: account.period,
      dates: expandMuseumDate(account.period),
      href: account.status === "expired" ? undefined : account.url,
      path: "/museum/accounts",
      searchText: searchable([account.title, account.description, account.period, account.url, resourceLinkLabel(account.url, lang), "account twitter x 過去 アカウント"]),
    })),
    ...sources.dailyPosts.map((post, index) => {
      const links = dailyPostLinks(post)
      const primaryLink = dailyPostPrimaryLink(post)
      const date = dailyPostDate(post)
      return {
        id: `daily-post-${post.id ?? index}`,
        collection: "daily-posts" as const,
        title: localizedText(post.title, lang),
        description: localizedText(post.description, lang),
        dateLabel: date,
        dates: [...new Set([date, ...links.map((link) => link.date)].flatMap((value) => expandMuseumDate(value)))],
        href: primaryLink.status !== "expired" ? primaryLink.url : undefined,
        path: "/museum/daily-posts",
        searchText: searchable([
          post.title,
          post.description,
          ...(post.tags ?? []),
          ...links.flatMap((link) => [link.label, link.platform]),
          "daily everyday 日常 投稿 reply repost 返信 リポスト",
        ]),
      }
    }),
  ]

  return sortMuseumSearchItems(items, lang)
}
