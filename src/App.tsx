import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  // Twitter, 
  // Instagram, 
  ExternalLink, 
  ArrowRight,
  Calendar,
  User,
  MapPin,
  Maximize2,
  Globe,
  Star,
  House,
  Users,
  Hotel,
  MicVocal,
  createLucideIcon
} from "lucide-react";
import { 
  COCO_PROFILE, 
  OFFICIAL_LINKS, 
  RESOURCE_LINKS, 
  TRANSLATIONS, 
  ACTIVITIES, 
  FAN_PROJECTS,
} from "./constants";

type Language = "ja" | "en";
type Tab = "home" | "activities" | "fan";

const XIcon = createLucideIcon('XIcon', [
  ["path", { d: 'M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z'}],
]);

const insIcon = createLucideIcon('insIcon', [
  ["path", { d: 'M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077'}],
]);

const IconButton = ({ icon: Icon, href, label }: { icon: any; href: string; label: string }) => (
  <motion.a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    className="group flex items-center justify-between p-4 bg-white border grid-line rounded hover:bg-coco-accent/5 hover:border-coco-accent transition-all"
  >
    <div className="flex items-center gap-4">
      <Icon className="w-5 h-5 text-coco-black group-hover:text-coco-accent transition-colors" />
      <span className="font-medium text-sm md:text-base">{label}</span>
    </div>
    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0 text-coco-accent" />
  </motion.a>
);

const MonoNumbers = ({ text }: { text: string }) => {
  const parts = text.split(/(\d+)/);
  return (
    <>
      {parts.map((part, i) => 
        /\d+/.test(part) ? (
          <span key={i} className="font-mono tabular-nums">{part}</span>
        ) : (
          part
        )
      )}
    </>
  );
};

export default function App() {
  const [lang, setLang] = useState<Language>("ja");
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const t = TRANSLATIONS[lang];

  const categories = [
    { id: "Musical", name: t.category_musical },
    { id: "Stage", name: t.category_stage },
    { id: "Program", name: t.category_program },
    { id: "Live", name: t.category_live },
  ];

  return (
    <div className="min-h-screen bg-coco-bg selection:bg-coco-accent/10">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b grid-line bg-coco-bg/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 md:px-12 h-20 flex items-center justify-between">
          <div className="font-serif text-2xl tracking-tight hidden lg:block">
            <span className="text-coco-accent">Coco</span> Unofficial Info Hub
          </div>
          
          <div className="flex items-center gap-2 md:gap-8 bg-coco-black/5 p-1 rounded-full border grid-line">
            {[
              { id: "home", label: t.home },
              { id: "activities", label: t.activities },
              { id: "fan", label: t.fan_projects }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`px-4 md:px-6 py-1.5 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all ${
                  activeTab === tab.id 
                    ? "bg-coco-accent text-white" 
                    : "text-coco-ink/40 hover:text-coco-ink"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-4">
            {/* Language Toggle */}
            <button 
              onClick={() => setLang(lang === "ja" ? "en" : "ja")}
              className="flex items-center gap-2 px-3 py-1.5 border grid-line rounded hover:border-coco-accent transition-all text-[10px] font-bold tracking-tighter"
            >
              <Globe className="w-3 h-3" />
              {lang === "ja" ? "English" : "日本語"}
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 md:px-12 py-32 flex flex-col md:flex-row gap-16 relative">
        {/* Sticky Sidebar Info */}
        {/* <aside className="md:w-64 hidden xl:block">
          <div className="sticky top-40 space-y-8">
            <div className="pt-4 border-l-2 border-coco-accent pl-6">
              <div className="text-[10px] uppercase tracking-widest opacity-40 mb-2">Current Section</div>
              <div className="text-2xl font-serif">{t[activeTab as keyof typeof t] || activeTab}</div>
            </div>
            
            <div className="pt-12 opacity-20 text-[9px] font-medium tracking-[0.2em] uppercase leading-loose">
              Unofficial Archive <br />
              Established <span className="font-mono">2026</span>
            </div>
          </div>
        </aside> */}

        <div className="flex-1 max-w-4xl min-h-[60vh]">
          <AnimatePresence mode="wait">
            {activeTab === "home" && (
              <motion.div
                key="home"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4 }}
                className="space-y-32"
              >
                {/* Hero */}
                <section>
                  <h1 className="text-6xl md:text-8xl mb-8 leading-tight">
                    {lang === "ja" ? COCO_PROFILE.name : COCO_PROFILE.romaji}
                  </h1>
                  <p className="text-xl md:text-2xl text-coco-ink/60 font-serif leading-relaxed max-w-2xl">
                    {t.hero_subtitle}
                  </p>
                </section>

                {/* Profile Grid */}
                <section id="about" className="space-y-12">
                  <h2 className="text-xs uppercase tracking-[0.3em] font-bold text-coco-accent">{t.about}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-12 gap-x-24 border-t grid-line pt-8">
                    {[
                      { label: t.born, value: lang === "ja" ? COCO_PROFILE.birthDate : COCO_PROFILE.birthDate_en },
                      { label: t.place, value: lang === "ja" ? COCO_PROFILE.birthPlace : COCO_PROFILE.bitthPlace_en },
                      { label: t.voice_range, value: COCO_PROFILE.voice_range },
                      { label: t.agency, value: lang === "ja" ? COCO_PROFILE.agency : COCO_PROFILE.agency_en },
                    ].map((item, i) => (
                      <div key={i} className="space-y-1">
                        <span className="text-[13px] uppercase tracking-widest opacity-40">{item.label}</span>
                        <p className="text-xl font-serif">
                          <MonoNumbers text={item.value} />
                        </p>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Links */}
                <section className="space-y-12 pb-24">
                  <h2 className="text-xs uppercase tracking-[0.3em] font-bold text-coco-accent">{t.links}</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[...OFFICIAL_LINKS, ...RESOURCE_LINKS].map((link, i) => {
                      const icons: any = {XIcon, insIcon, House, Star, Hotel, ExternalLink };
                      return (
                        <IconButton 
                          key={i}
                          icon={icons[link.icon] || ExternalLink} 
                          href={link.url}
                          label={lang === "ja" ? link.platform["ja"] : link.platform["en"]}
                        />
                      );
                    })}
                  </div>
                </section>
              </motion.div>
            )}

            {activeTab === "activities" && (
              <motion.div
                key="activities"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4 }}
                className="space-y-20 pb-32"
              >
                <div className="border-b grid-line pb-12">
                  <h1 className="text-5xl md:text-7xl font-serif mb-4">{t.activities}</h1>
                  <p className="text-coco-ink/50 uppercase tracking-widest text-xs">Performance History & Schedule</p>
                </div>

                {categories.map((cat) => (
                  <div key={cat.id} className="space-y-8">
                    <h3 className="text-sm uppercase tracking-[0.3em] font-bold text-coco-accent flex items-center gap-3">
                      <MicVocal className="w-4 h-4" />
                      {cat.name}
                    </h3>
                    <div className="border-t grid-line divide-y grid-line">
                      {ACTIVITIES.filter(a => a.category === cat.id).map((act, i) => (
                        <div key={i} className="py-6 flex flex-col md:flex-row md:items-start justify-between gap-4">
                          <div className="md:w-32 font-mono text-sm text-coco-ink/40">{act.date}</div>
                          <div className="flex-1">
                            <div className="text-xl font-serif mb-1">{act.title[lang]}</div>
                            {act.description && (
                              <div className="text-sm text-coco-ink/60">{act.description[lang]}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {activeTab === "fan" && (
              <motion.div
                key="fan"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4 }}
                className="space-y-20 pb-32"
              >
                <div className="border-b grid-line pb-12">
                  <h1 className="text-5xl md:text-7xl font-serif mb-4">{t.fan_projects}</h1>
                  <p className="text-coco-ink/50 uppercase tracking-widest text-xs">Community Support & Activity</p>
                </div>

                <div className="grid grid-cols-1 gap-8">
                  {FAN_PROJECTS.map((project, i) => (
                    <div key={i} className="p-8 border grid-line bg-white hover:border-coco-accent transition-colors group">
                      <div className="flex flex-col md:flex-row justify-between gap-6">
                        <div className="space-y-4 flex-1">
                          <div className="flex items-center gap-2 text-coco-accent text-[10px] font-bold uppercase tracking-widest">
                            <Users className="w-3 h-3" />
                            {t.fan_projects}
                          </div>
                          <h3 className="text-2xl font-serif">{project.title[lang]}</h3>
                          <p className="text-coco-ink/60 leading-relaxed max-w-2xl">{project.description[lang]}</p>
                          
                          <div className="flex items-center gap-4 pt-4 text-xs">
                            <span className="opacity-40">{t.organizer}:</span>
                            {project.organizerUrl ? (
                              <a href={project.organizerUrl} target="_blank" rel="noopener" className="font-bold hover:text-coco-accent flex items-center gap-1 underline underline-offset-4">
                                {project.organizer}
                                <ArrowRight className="w-3 h-3" />
                              </a>
                            ) : (
                              <span className="font-bold">{project.organizer}</span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-end">
                          <motion.a
                            href={project.url}
                            target="_blank"
                            rel="noopener"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="bg-coco-black text-white px-6 py-3 text-xs font-bold uppercase tracking-widest rounded flex items-center gap-2 group-hover:bg-coco-accent transition-colors"
                          >
                            {lang === "ja" ? "詳細" : "Details"}
                            <ExternalLink className="w-4 h-4" />
                          </motion.a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t grid-line py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] uppercase tracking-widest opacity-30 font-medium text-center md:text-left">
          <div className="flex items-center gap-4">
            <span><MonoNumbers text="© 2026 GC Zhu. All Rights Reserved. This site is a fan project and is not affiliated with or endorsed by LIBERTE or Coco Hayashi." /></span>
            {/* <div className="w-1 h-1 bg-coco-ink rounded-full" /> */}
            {/* <span>Coco Harbor Fan Hub</span> */}
          </div>
          {/* <div>Broadcasting from Shizuoka</div> */}
        </div>
      </footer>
    </div>
  );
}
