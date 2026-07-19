export type Language = "ja" | "en";

export interface Role {
  year: string;
  title: { ja: string; en: string };
  character: { ja: string; en: string };
}

export interface Activity {
  category: "Stage" | "Musical" | "Program" | "Live" | "Reading" | "Other";
  date: string;
  startDate?: string;
  endDate?: string;
  activeDates?: string[];
  title: { ja: string; en: string };
  description?: { ja: string; en: string };
  link: string;
  ticketInfo?: TicketInfo;
}

export interface FanProject {
  title: { ja: string; en: string };
  organizer: string;
  organizerUrl?: string;
  url: string;
  description: { ja: string; en: string };
}

export interface LinkItem {
  platform: { ja: string; en: string };
  url: string;
  description: { ja: string; en: string };
  icon: string;
}

export interface HistoricalResource {
  date: string;
  title: { ja: string; en: string };
  description?: { ja: string; en: string };
  url?: string;
  status: "available" | "expired";
}

export interface Note {
  title: { ja: string; en: string };
  date?: string;
  category?: { ja: string; en: string };
  description?: { ja: string; en: string };
  link?: string;
  relatedLinks?: NoteRelatedLink[];
}

export interface NoteRelatedLink {
  url: string;
  title?: { ja: string; en: string };
  type?: { ja: string; en: string };
}

export interface TicketInfo {
  venue?: { ja: string; en: string };
  officialUrl?: string;
  entries: TicketEntry[];
}

export interface TicketEntry {
  type: { ja: string; en: string };
  startDate?: string;
  endDate?: string;
  period: { ja: string; en: string };
  price: { ja: string; en: string };
  note?: { ja: string; en: string };
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
  label: { ja: string; en: string };
  url: string;
  date?: string;
}

export interface WardrobeItem {
  id: string;
  category: WardrobeCategory;
  color?: { ja: string; en: string };
  title: { ja: string; en: string };
  description: { ja: string; en: string };
  brand?: string;
  productName?: string;
  identification: {
    status: WardrobeIdentificationStatus;
    note?: { ja: string; en: string };
  };
  sources: WardrobeSource[];
}
