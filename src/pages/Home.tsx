import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ExternalLink as ExternalLinkIcon, ArrowRight, Star, House, Hotel } from "lucide-react"
import { SiX, SiInstagram } from "react-icons/si"
import { TRANSLATIONS } from "../i18n"
import COCO_PROFILE from "../data/profile.yaml"
import LINKS from "../data/links.yaml"
import ACTIVITIES from "../data/activities.yaml"
import type { Activity, Language, LinkItem, Profile } from "../types"
import { buildCalendarData } from "../hooks/useCalendarEvents"
import { getCalendarActivities } from "../utils/activityStatus"
import useJapanNow from "../hooks/useJapanNow"
import CalendarMonth from "../components/CalendarMonth"
import ExternalAnchor from "../components/ExternalAnchor"
import { localizedText } from "../utils/localizedText"

const LINK_ICONS = { SiX, SiInstagram, House, Star, Hotel, ExternalLink: ExternalLinkIcon }

export default function Home({ lang }: { lang: Language }) {
  const t = TRANSLATIONS[lang]
  const navigate = useNavigate()

  const allActivities = ACTIVITIES as Activity[]
  const links = LINKS as LinkItem[]
  const profile = COCO_PROFILE as Profile
  const now = useJapanNow()
  const today = now.substring(0, 10)
  const calendarActivities = getCalendarActivities(allActivities, now)
  const months = buildCalendarData(calendarActivities, today)

  const [monthIndex, setMonthIndex] = useState(() => {
    const todayKey = today.substring(0, 7)
    const idx = months.findIndex(m => m.key === todayKey)
    return idx >= 0 ? idx : months.findIndex(m => m.key >= todayKey) >= 0 ? months.findIndex(m => m.key >= todayKey) : 0
  })

  const scrollToEvent = (activityId: string) => {
    navigate("/activities", { state: { activityId } })
  }

  return (
    <div className="home-sections">
      <section className="min-w-0">
        <h1 className="home-title mb-8 leading-tight">
          {localizedText(profile.name, lang)}
        </h1>
        <p className="text-[clamp(1.25rem,1.6vw,1.5rem)] text-coco-ink/60 font-serif leading-relaxed max-w-2xl">
          {t.hero_subtitle}
        </p>
      </section>

      <section id="about" className="home-section">
        <h2 className="text-[15px] uppercase tracking-[0.3em] font-bold text-coco-accent">{t.about}</h2>
        <div className="profile-grid">
          {profile.items.map((item) => (
            <div key={item.id} className="min-w-0 space-y-1">
              <span className="text-[13px] uppercase tracking-widest opacity-40">{localizedText(item.label, lang)}</span>
              <p className="text-xl font-serif">
                {localizedText(item.value, lang)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Calendar Section */}
      {months.length > 0 && (
        <section className="home-section">
          <h2 className="text-[15px] uppercase tracking-[0.3em] font-bold text-coco-accent">
            {t["event_calendar"]}
          </h2>
          {months[monthIndex] && (
            <CalendarMonth
              month={months[monthIndex]}
              lang={lang}
              today={today}
              now={now}
              activities={calendarActivities}
              onSelectEvent={scrollToEvent}
              className="w-full"
              hasPrev={monthIndex > 0}
              hasNext={monthIndex < months.length - 1}
              onPrev={() => setMonthIndex((i) => i - 1)}
              onNext={() => setMonthIndex((i) => i + 1)}
              monthKeys={months.map((month) => month.key)}
              onSelectMonth={(monthKey) => {
                const selectedIndex = months.findIndex(
                  (month) => month.key === monthKey
                )
                if (selectedIndex >= 0) setMonthIndex(selectedIndex)
              }}
            />
          )}
        </section>
      )}

      <section className="home-section pb-24">
        <h2 className="text-[15px] uppercase tracking-[0.3em] font-bold text-coco-accent">{t.links}</h2>
        <div className="home-grid gap-y-4">
          {links.map((link) => {
            const Icon = LINK_ICONS[link.icon as keyof typeof LINK_ICONS] ?? ExternalLinkIcon
            return (
              <ExternalAnchor
                key={link.url}
                href={link.url}
                className="group flex min-w-0 items-center justify-between gap-4 rounded border grid-line bg-white p-[clamp(1rem,1.5vw,1.5rem)] transition-colors hover:border-coco-accent hover:bg-coco-accent/5 dark:bg-neutral-900"
              >
                <div className="flex min-w-0 items-center gap-4">
                  <Icon className="w-5 h-5 shrink-0 text-coco-ink group-hover:text-coco-accent transition-colors" />
                  <span className="min-w-0 break-words font-medium text-[clamp(0.875rem,1.1vw,1rem)]">{link.platform[lang]}</span>
                </div>
                <ArrowRight className="w-4 h-4 shrink-0 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0 text-coco-accent" />
              </ExternalAnchor>
            )
          })}
        </div>
      </section>
    </div>
  )
}
