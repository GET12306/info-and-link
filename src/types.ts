export type Language = "ja" | "en";

export interface Role {
  year: string;
  title: { ja: string; en: string };
  character: { ja: string; en: string };
}

export interface Activity {
  category: "Stage" | "Musical" | "Program" | "Live" | "Other";
  date: string;
  startDate?: string;
  endDate?: string;
  activeDates?: string[];
  title: { ja: string; en: string };
  description?: { ja: string; en: string };
  link: string;
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
