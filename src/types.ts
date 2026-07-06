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
