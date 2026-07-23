import type { ActivityCategory } from "./config/activityCategories";

export type Language = "ja" | "en";
export type LocalizedText = Record<Language, string>;

export interface Role {
  year: string;
  title: LocalizedText;
  character: LocalizedText;
}

export interface Activity {
  category: ActivityCategory;
  date: string;
  startDate?: string;
  endDate?: string;
  activeDates?: string[];
  title: LocalizedText;
  description?: LocalizedText;
  link: string;
  ticketInfo?: TicketInfo;
}

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
  relatedLinks?: NoteRelatedLink[];
}

export interface NoteRelatedLink {
  url: string;
  title?: LocalizedText;
  type?: LocalizedText;
}

export interface TicketInfo {
  venue?: LocalizedText;
  officialUrl?: string;
  entries: TicketEntry[];
}

export interface TicketEntry {
  type: LocalizedText;
  startDate?: string;
  endDate?: string;
  period: string;
  price: LocalizedText;
  note?: LocalizedText;
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
