import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ExternalLink as ExternalLinkIcon, ArrowRight, Star, House, Hotel } from "lucide-react"
import { SiX, SiInstagram } from "react-icons/si"
import { TRANSLATIONS } from "../i18n"
import COCO_PROFILE from "../data/profile.yaml"
import LINKS from "../data/links.yaml"
import ACTIVITIES from "../data/activities.yaml"
import type { Activity, Language, LinkItem } from "../types"
import { buildCalendarData } from "../hooks/useCalendarEvents"
import { getCalendarActivities } from "../utils/activityStatus"
import CalendarMonth from "../components/CalendarMonth"
import ExternalAnchor from "../components/ExternalAnchor"

const LINK_ICONS = { SiX, SiInstagram, House, Star, Hotel, ExternalLink: ExternalLinkIcon }

export default function Home({ lang }: { lang: Language }) {
  const t = TRANSLATIONS[lang]
  const navigate = useNavigate()

  const allActivities = ACTIVITIES as Activity[]
  const links = LINKS as LinkItem[]
  const today = (() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
  })()
  const calendarActivities = getCalendarActivities(allActivities, today)
  const months = buildCalendarData(calendarActivities, today)

  const [monthIndex, setMonthIndex] = useState(() => {
    const now = new Date()
    const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
    const idx = months.findIndex(m => m.key === todayKey)
    return idx >= 0 ? idx : months.findIndex(m => m.key >= todayKey) >= 0 ? months.findIndex(m => m.key >= todayKey) : 0
  })

  const scrollToEvent = (index: number) => {
    navigate("/activities", { state: { scrollTo: index } })
  }

  return (
    <div className="space-y-32">
      <section>
        <h1 className="text-6xl md:text-8xl mb-8 leading-tight">
          {lang === "ja" ? COCO_PROFILE.name : COCO_PROFILE.romaji}
        </h1>
        <p className="text-xl md:text-2xl text-coco-ink/60 font-serif leading-relaxed max-w-2xl">
          {t.hero_subtitle}
        </p>
      </section>

      <section id="about" className="space-y-12">
        <h2 className="text-[15px] uppercase tracking-[0.3em] font-bold text-coco-accent">{t.about}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-12 gap-x-24 grid-line pt-0">
          {[
            { label: t.born, value: lang === "ja" ? COCO_PROFILE.birthDate : COCO_PROFILE.birthDate_en },
            { label: t.place, value: lang === "ja" ? COCO_PROFILE.birthPlace : COCO_PROFILE.birthPlace_en },
            { label: t.voice_range, value: COCO_PROFILE.voice_range },
            { label: t.agency, value: lang === "ja" ? COCO_PROFILE.agency : COCO_PROFILE.agency_en },
          ].map((item, i) => (
            <div key={i} className="space-y-1">
              <span className="text-[13px] uppercase tracking-widest opacity-40">{item.label}</span>
              <p className="text-xl font-serif">
                {/* <MonoNumbers text={item.value} /> */}
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Calendar Section */}
      {months.length > 0 && (
        <section className="space-y-12">
          <h2 className="text-[15px] uppercase tracking-[0.3em] font-bold text-coco-accent">
            {t["event_calendar"]}
          </h2>
          {months[monthIndex] && (
            <CalendarMonth
              month={months[monthIndex]}
              lang={lang}
              today={today}
              activities={calendarActivities}
              onSelectEvent={scrollToEvent}
              className="w-full"
              hasPrev={monthIndex > 0}
              hasNext={monthIndex < months.length - 1}
              onPrev={() => setMonthIndex((i) => i - 1)}
              onNext={() => setMonthIndex((i) => i + 1)}
            />
          )}
        </section>
      )}

      <section className="space-y-12 pb-24">
        <h2 className="text-[15px] uppercase tracking-[0.3em] font-bold text-coco-accent">{t.links}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {links.map((link) => {
            const Icon = LINK_ICONS[link.icon as keyof typeof LINK_ICONS] ?? ExternalLinkIcon
            return (
              <ExternalAnchor
                key={link.url}
                href={link.url}
                className="group flex items-center justify-between rounded border grid-line bg-white p-4 transition-all hover:scale-[1.02] hover:border-coco-accent hover:bg-coco-accent/5 active:scale-[0.98] dark:bg-neutral-900"
              >
                <div className="flex items-center gap-4">
                  <Icon className="w-5 h-5 text-coco-ink group-hover:text-coco-accent transition-colors" />
                  <span className="font-medium text-sm md:text-base">{link.platform[lang]}</span>
                </div>
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0 text-coco-accent" />
              </ExternalAnchor>
            )
          })}
        </div>
      </section>
    </div>
  )
}
