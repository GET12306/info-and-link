import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ExternalLink,
  ArrowRight,
  Globe,
  Star,
  House,
  Users,
  Hotel,
  MicVocal,
  Music,
  Ticket,
  Tv,
  BookOpenText,
} from "lucide-react";
import { SiX, SiInstagram } from 'react-icons/si';
import { TRANSLATIONS } from "./i18n";
import COCO_PROFILE from "./data/profile.yaml";
import ACTIVITIES from "./data/activities.yaml";
import FAN_PROJECTS from "./data/fan-projects.yaml";
import OFFICIAL_LINKS from "./data/official-links.yaml";
import RESOURCE_LINKS from "./data/resource-links.yaml";
import ABOUT_THIS_WEB from "./data/about.yaml";

type Language = "ja" | "en";
type Tab = "home" | "activities" | "fan" | "about_this_web";


const IconButton = ({ icon: Icon, href, label }: { icon: any; href: string; label: string; }) => (
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
    // Sort here
    { id: "Live", name: t.category_live },
    { id: "Musical", name: t.category_musical },
    { id: "Stage", name: t.category_stage },
    { id: "Reading", name: t.category_reading },
    { id: "Program", name: t.category_program },
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
              { id: "fan", label: t.fan_projects },
              { id: "about_this_web", label: t.about_this_web },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`px-4 md:px-6 py-1.5 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all ${activeTab === tab.id
                  ? "bg-coco-accent text-white"
                  : "text-coco-ink/40 hover:text-coco-ink"
                  }`}
              >
                {tab.label}
              </button>
            ))}
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
                      { label: t.place, value: lang === "ja" ? COCO_PROFILE.birthPlace : COCO_PROFILE.birthPlace_en },
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
                      const icons: any = { SiX, SiInstagram, House, Star, Hotel, ExternalLink };
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
                      {cat.id === "Musical" && <Music className="w-4 h-4" />}
                      {cat.id === "Stage" && <Ticket className="w-4 h-4" />}
                      {cat.id === "Program" && <Tv className="w-4 h-4" />}
                      {cat.id === "Live" && <MicVocal className="w-4 h-4" />}
                      {cat.id === "Reading" && <BookOpenText className="w-4 h-4" />}
                      {cat.name}
                    </h3>
                    <div className="border-t grid-line divide-y grid-line">
                      {ACTIVITIES.filter(a => a.category === cat.id).map((act, i) => (
                        <div key={i} className="py-6 flex flex-col md:flex-row md:items-start justify-between gap-4">
                          <div className="md:w-32 font-mono text-sm text-coco-ink/40">{act.date}</div>
                          <a href={act.link} target="_blank" rel="noopener noreferrer" className="flex-1 hover:opacity-80 transition-opacity">
                            <div className="text-xl font-serif mb-1">{act.title[lang]}</div>
                            {act.description && (
                              <div className="text-sm text-coco-ink/60">{act.description[lang]}</div>
                            )}
                          </a>
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
                  {FAN_PROJECTS.length > 0 ? (
                    FAN_PROJECTS.map((project, i) => (
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
                    ))
                  ) : (
                    <div className="py-20 text-center border grid-line bg-white/50">
                      <p className="text-coco-ink/30 font-serif text-3xl">{t.coming_soon}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === "about_this_web" && (
              <motion.div
                key="about_this_web"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4 }}
                className="space-y-20 pb-32"
              >
                <div className="border-b grid-line pb-12">
                  <h1 className="text-5xl md:text-7xl font-serif mb-4">{t.about_this_web}</h1>
                  <p className="text-coco-ink/50 uppercase tracking-widest text-xs">About This Website</p>
                </div>

                <div className="space-y-8">
                  <div className="p-8 border grid-line bg-white hover:border-coco-accent transition-colors">
                    <div className="text-coco-ink/60 leading-relaxed space-y-4">
                      <p className="whitespace-pre-wrap">
                        {lang === "ja"
                          ? ABOUT_THIS_WEB["site_description"]["ja"]
                          : ABOUT_THIS_WEB["site_description"]["en"]}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t grid-line py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col items-center gap-6 text-[10px] uppercase tracking-widest opacity-30 font-medium text-center">
          <span><MonoNumbers text="© 2026 GC Zhu. All Rights Reserved. This site is a fan project and is not affiliated with or endorsed by LIBERTE or Coco Hayashi." /></span>
          <button
            onClick={() => setLang(lang === "ja" ? "en" : "ja")}
            className="flex items-center gap-2 px-3 py-1.5 border grid-line rounded hover:border-coco-accent transition-all"
          >
            <Globe className="w-3 h-3" />
            {lang === "ja" ? "English" : "日本語"}
          </button>
        </div>
      </footer>
    </div>
  );
}
