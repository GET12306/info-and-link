import {
  BookOpenText,
  CalendarDays,
  CircleEllipsis,
  MicVocal,
  Music,
  Ticket,
  Tv,
  type LucideIcon,
} from "lucide-react"

export const ACTIVITY_CATEGORY_ORDER = [
  "Live",
  "Musical",
  "Stage",
  "Reading",
  "Event",
  "Program",
  "Other",
] as const

export type ActivityCategory = (typeof ACTIVITY_CATEGORY_ORDER)[number]

export const ACTIVITY_CATEGORY_META: Record<
  ActivityCategory,
  {
    labelKey:
      | "category_live"
      | "category_musical"
      | "category_stage"
      | "category_reading"
      | "category_event"
      | "category_program"
      | "category_other"
    compactLabel: { ja: string; en: string }
    icon: LucideIcon
  }
> = {
  Live: {
    labelKey: "category_live",
    compactLabel: { ja: "ライブ", en: "Live" },
    icon: MicVocal,
  },
  Musical: {
    labelKey: "category_musical",
    compactLabel: { ja: "音楽劇", en: "Musical" },
    icon: Music,
  },
  Stage: {
    labelKey: "category_stage",
    compactLabel: { ja: "舞台", en: "Stage" },
    icon: Ticket,
  },
  Reading: {
    labelKey: "category_reading",
    compactLabel: { ja: "朗読", en: "Reading" },
    icon: BookOpenText,
  },
  Event: {
    labelKey: "category_event",
    compactLabel: { ja: "イベント", en: "Event" },
    icon: CalendarDays,
  },
  Program: {
    labelKey: "category_program",
    compactLabel: { ja: "配信", en: "Stream" },
    icon: Tv,
  },
  Other: {
    labelKey: "category_other",
    compactLabel: { ja: "その他", en: "Other" },
    icon: CircleEllipsis,
  },
}
