import { TRANSLATIONS } from "../i18n"
import { ACTIVITY_CATEGORY_META } from "../config/activityCategories"
import type { Activity } from "../types"

type TranslationSet = typeof TRANSLATIONS["en"]

export function getActivityCategoryLabel(
  category: Activity["category"] | undefined,
  translations: TranslationSet
) {
  return category ? translations[ACTIVITY_CATEGORY_META[category].labelKey] : ""
}
