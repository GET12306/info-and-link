import { TRANSLATIONS } from "../i18n"
import type { Activity } from "../types"

type TranslationSet = typeof TRANSLATIONS["en"]
type TranslationKey = keyof TranslationSet

const CATEGORY_LABEL_KEYS: Record<Activity["category"], TranslationKey> = {
  Stage: "category_stage",
  Musical: "category_musical",
  Program: "category_program",
  Live: "category_live",
  Reading: "category_reading",
  Other: "category_other",
}

export function getActivityCategoryLabel(
  category: Activity["category"] | undefined,
  translations: TranslationSet
) {
  return category ? translations[CATEGORY_LABEL_KEYS[category]] : ""
}
