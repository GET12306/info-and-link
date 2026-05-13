export interface Role {
  year: string;
  title: { ja: string; en: string };
  character: { ja: string; en: string };
}

export interface Activity {
  category: "Stage" | "Musical" | "Program" | "Live" | "Other";
  date: string;
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

export const TRANSLATIONS = {
  ja: {
    home: "ホーム",
    activities: "活動情報",
    fan_projects: "ファンプロジェクト",
    about_this_web: "このウェブについて",
    about: "プロフィール",
    roles: "主な出演作",
    links: "リンク",
    born: "生年月日",
    place: "出身地",
    voice_range: "音域",
    agency: "所属",
    follow: "フォロー",
    resources: "リソース",
    hero_title: "林 鼓子",
    hero_subtitle: "声優・俳優",
    category_stage: "舞台",
    category_musical: "ミュージカル",
    category_program: "番組・イベント",
    category_live: "ライブ",
    organizer: "主催者",
    coming_soon: "Coming Soon",
  },
  en: {
    home: "Home",
    activities: "Event Information",
    fan_projects: "Fan Projects",
    about_this_web: "About This Web",
    about: "Profile",
    roles: "Major Roles",
    links: "Links",
    born: "Birth Date",
    place: "Birth Place",
    voice_range: "Voice Range",
    agency: "Agency",
    follow: "Follow",
    resources: "Resources",
    hero_title: "Coco Hayashi",
    hero_subtitle: "Voice Actress and Stage Actress.",
    category_stage: "Stage Performance",
    category_musical: "Musical",
    category_program: "Program & Event",
    category_live: "Live",
    organizer: "Organizer",
    coming_soon: "Coming Soon",
  },
};

export const COCO_PROFILE = {
  name: "林 鼓子",
  romaji: "Coco Hayashi",
  birthDate: "2002年5月15日",
  birthDate_en: "May 15th, 2002",
  birthPlace: "静岡県",
  birthPlace_en: "Shizuoka",
  voice_range: "G3〜A#5",
  agency: "株式会社LIBERTE",
  agency_en: "LIBERTE",
};

export const ABOUT_THIS_WEB = {
  site_name: "林 鼓子 Unofficial Info Hub",
  site_name_en: "Coco Hayashi Unofficial Info Hub",
  site_url: "https://cocohayashi.net",
  site_description: {
    ja: "当サイトは個人が運営する非公式の情報収集サイトであり、掲載されている情報は参考目的としてのみご利用ください。\n内容に誤りがある場合や、ファンプロジェクトへ追加したい情報がございましたら、お手数ですが下記のメールアドレスまでご連絡をお願いいたします。\n\n連絡先（Email）：artsy.grower.4d@icloud.com",
    en: "This is an unofficial information-gathering website and fan project. The content provided here is for reference purposes only.\nIf you notice any errors, or have information you would like to contribute to the fan project, please feel free to contact me via the email address below.\n\nContact Email: artsy.grower.4d@icloud.com",
  },
}

export const ACTIVITIES: Activity[] = [
  {
    category: "Musical",
    date: "2026.03.16-22",
    title: { ja: "ミュージカル「スキップとローファー」", en: "Musical 'Skip and Loafer'" },
    description: { ja: "江頭ミカ役", en: "As Mika Egashira" },
    link: "https://www.marv.jp/special/skip-and-loafer",
  },
  {
    category: "Stage",
    date: "2026.04.18-26",
    title: { ja: "「アサルトリリィ・シュツルム」~サングリーズル編 第2弾~", en: "Assault Lily: Sturm ~Sanngriðr Chapter, Part 2~" },
    description: { ja: "⻑坂稀星役", en: "As Maho Nagasaka" },
    link: "https://assaultlily-stage.jp/2604stage",
  },
  {
    category: "Program",
    date: "Weekly",
    title: { ja: "林鼓子のメゾンド・ココ", en: "Maison De Coco" },
    description: { ja: "毎週金曜22時", en: "Every Friday at 10 p.m. (JST)" },
    link: "https://audee-membership.jp/coco-hayashi",
  },
  {
    category: "Live",
    date: "2026.06.06-07, 13-14",
    title: { ja: "ラブライブ！虹ヶ咲学園スクールアイドル同好会 8th Live! TOKIMEKI Express", en: "8th Live! TOKIMEKI Express" },
    description: { ja: "優木せつ菜役", en: "As Setsuna Yuki" },
    link: "https://www.lovelive-anime.jp/nijigasaki/live/live_detail.php?p=8thlive",
  }
];

export const FAN_PROJECTS: FanProject[] = [
  // {
  //   title: { ja: "バースデー記念フラワースタンド2024", en: "Birthday Flower Stand 2024" },
  //   organizer: "@coco_fan_project",
  //   organizerUrl: "https://x.com/cocohayashi515",
  //   url: "https://x.com/cocohayashi515",
  //   description: { ja: "林鼓子さんの誕生日を祝うファン有志によるフラスタ企画。", en: "A flower stand project organized by fans to celebrate Coco's birthday." }
  // },
];

export const ROLES: Role[] = [
  {
    year: "2018",
    title: { ja: "キラッとプリ☆チャン", en: "Kiratto Pri-chan" },
    character: { ja: "桃山みらい", en: "Mirai Momoyama" }
  },
  {
    year: "2023",
    title: { ja: "ラブライブ！虹ヶ咲学園スクールアイドル同好会", en: "Love Live! Nijigasaki High School Idol Club" },
    character: { ja: "優木せつ菜", en: "Setsuna Yuki" }
  },
  {
    year: "2023",
    title: { ja: "BanG Dream! It's MyGO!!!!!", en: "BanG Dream! It's MyGO!!!!!" },
    character: { ja: "椎名立希", en: "Taki Shiina" }
  },
];

export const OFFICIAL_LINKS: LinkItem[] = [
  {
    platform: { ja: "X(Twitter)", en: "X(Twitter)" },
    url: "https://x.com/cocohayashi515",
    description: { ja: "公式 X", en: "Official X" },
    icon: "SiX",
  },
  {
    platform: { ja: "Instagram", en: "Instagram" },
    url: "https://www.instagram.com/coco_hayashi.official",
    description: { ja: "公式 Instagram", en: "Official Instagram" },
    icon: "SiInstagram",
  },
  {
    platform: { ja: "事務所HP", en: "Agency Homepage" },
    url: "https://liberte2024.com/talent/hayashicoco",
    description: { ja: "事務所HP", en: "Agency Homepage" },
    icon: "Hotel",
  },
  {
    platform: { ja: "鼓星", en: "Official Fan Club" },
    url: "https://fan.pia.jp/cocohayashi",
    description: { ja: "公式 ファンクラブ", en: "Offical Fan Club" },
    icon: "Star",
  },
];

export const RESOURCE_LINKS: LinkItem[] = [
  {
    platform: { ja: "林鼓子のメゾンド・ココ", en: "Maison De Coco" },
    url: "https://audee-membership.jp/coco-hayashi",
    description: { ja: "ラジオ番組", en: "Weekly Podcast" },
    icon: "House",
  },
];

