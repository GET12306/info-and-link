import type { ArchiveText, Language } from "../types"

/** Resolve shared or partially translated copy with a predictable fallback. */
export function localizedText(text: ArchiveText | undefined, lang: Language): string {
  if (typeof text === "string") return text
  const fallback = lang === "ja" ? "en" : "ja"
  return text?.[lang] || text?.[fallback] || ""
}
