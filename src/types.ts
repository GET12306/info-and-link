import type { ActivityCategory } from "./config/activityCategories";

export type Language = "ja" | "en";
export type LocalizedText = Record<Language, string>;

export type ActivityMilestoneKind = "update" | "merch" | "doors" | "other";

export interface ActivityMilestone {
  kind: ActivityMilestoneKind;
  at: string;
  until?: string;
  label?: LocalizedText;
}

export interface Role {
  year: string;
  title: LocalizedText;
  character: LocalizedText;
}

export interface Activity {
  id: string;
  category: ActivityCategory;
  scheduleLabel: string;
  startDate?: string;
  endDate?: string;
  recurrence?: ActivityRecurrence;
  durationMinutes?: number;
  calendarExport?: "auto" | "enabled" | "disabled";
  performances?: ActivityPerformance[];
  title: LocalizedText;
  venue?: LocalizedText;
  description?: LocalizedText;
  link: string;
  ticketInfo?: TicketInfo;
}

export type ActivityWeekday =
  | "sunday"
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday";

export interface ManualActivityRecurrence {
  type: "manual";
}

export interface WeeklyActivityRecurrenceOverride {
  /** The generated occurrence date being replaced or cancelled. */
  date: string;
  /** A replacement same-day JST time. */
  startTime?: string;
  cancelled?: boolean;
}

export interface WeeklyActivityRecurrence {
  type: "weekly";
  startOn: string;
  endOn: string;
  weekday: ActivityWeekday;
  startTime: string;
  overrides?: WeeklyActivityRecurrenceOverride[];
}

export type ActivityRecurrence =
  | ManualActivityRecurrence
  | WeeklyActivityRecurrence;

export interface TimedActivityPerformance {
  startAt: string;
  endAt?: string;
  occursOn?: never;
  label?: LocalizedText;
  milestones?: ActivityMilestone[];
}

export interface DateOnlyActivityPerformance {
  occursOn: string;
  startAt?: never;
  endAt?: never;
  label?: LocalizedText;
  milestones?: ActivityMilestone[];
}

export type ActivityPerformance =
  | TimedActivityPerformance
  | DateOnlyActivityPerformance;

export interface FanProject {
  title: LocalizedText;
  organizer: string;
  organizerUrl?: string;
  url: string;
  description: LocalizedText;
}

export interface LinkItem {
  platform: LocalizedText;
  url: string;
  description: LocalizedText;
  icon: string;
}

export interface HistoricalResource {
  date: string;
  title: LocalizedText;
  description?: LocalizedText;
  url?: string;
  status: "available" | "expired";
}

export interface Note {
  title: LocalizedText;
  date?: string;
  category?: LocalizedText;
  description?: LocalizedText;
  link?: string;
  status?: "available" | "expired";
  relatedLinks?: NoteRelatedLink[];
}

export interface NoteRelatedLink {
  url: string;
  title?: LocalizedText;
  type?: LocalizedText;
  status?: "available" | "expired";
}

export interface PhotoBookCover {
  url: string;
  alt: LocalizedText;
  sourceUrl: string;
}

export interface PhotoBookLink {
  label: LocalizedText;
  url: string;
}

export interface PhotoBook {
  id: string;
  title: LocalizedText;
  subtitle?: LocalizedText;
  releaseDate: string;
  description: LocalizedText;
  cover?: PhotoBookCover;
  photographer?: string;
  publisher: string;
  distributor?: string;
  isbn?: string;
  format?: LocalizedText;
  price?: LocalizedText;
  links: PhotoBookLink[];
}

export interface TicketInfo {
  link?: string;
  price?: LocalizedText;
  entries: TicketEntry[];
}

export interface TicketEntry {
  type: LocalizedText;
  /** YYYY-MM-DD, or YYYY-MM-DDTHH:mm when an exact JST time is known. */
  startAt?: string;
  /** YYYY-MM-DD, or YYYY-MM-DDTHH:mm when an exact JST time is known. */
  endAt?: string;
  scheduleLabel: string;
  price?: LocalizedText;
  description?: LocalizedText;
  link?: string;
}

export type WardrobeCategory =
  | "tops"
  | "outerwear"
  | "bottoms"
  | "dress"
  | "shoes"
  | "bag"
  | "accessory"
  | "other";

export type WardrobeIdentificationStatus = "confirmed" | "probable" | "similar" | "unknown";

export interface WardrobeSource {
  type: "x" | "instagram" | "youtube" | "official" | "store" | "article" | "other";
  label: LocalizedText;
  url: string;
  date?: string;
}

export interface WardrobeItem {
  id: string;
  category: WardrobeCategory;
  color?: LocalizedText;
  title: LocalizedText;
  description: LocalizedText;
  brand?: string;
  productName?: string;
  identification: {
    status: WardrobeIdentificationStatus;
    note?: LocalizedText;
  };
  sources: WardrobeSource[];
}
