import type { Language, Magazine } from "../types"
import { localizedText } from "./localizedText"

export { localizedText as archiveText } from "./localizedText"

export function filterMagazines(entries: Magazine[], query: string, year: string, lang: Language) {
  const needle = query.trim().normalize("NFKC").toLocaleLowerCase()
  return entries.filter(entry => (!year || entry.publicationDate?.slice(0, 4) === year) &&
    [entry.title, entry.issue, entry.publisher, entry.feature, entry.notes].flatMap(value =>
      [localizedText(value, lang), localizedText(value, "ja"), localizedText(value, "en")]
    ).join(" ").normalize("NFKC").toLocaleLowerCase().includes(needle)
  ).sort((a, b) => (b.publicationDate ?? "").localeCompare(a.publicationDate ?? ""))
}
