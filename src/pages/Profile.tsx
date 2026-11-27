import { PageHeader, PageLayout } from "../components/PageLayout"
import DATA from "../data/profile.yaml"
import { TRANSLATIONS } from "../i18n"
import type { Language, Profile } from "../types"
import { localizedText } from "../utils/localizedText"

export default function ProfilePage({ lang }: { lang: Language }) {
  const profile = DATA as Profile
  const t = TRANSLATIONS[lang]
  return (
    <PageLayout compact>
      <PageHeader title={localizedText(profile.name, lang)} subtitle={t.hero_subtitle}
        backLink={{ to: "/", label: t.home }} />
      <section className="space-y-6">
        <h2 className="text-[15px] font-bold uppercase tracking-[0.3em] text-coco-accent">{t.about}</h2>
        <dl className="profile-grid">
          {profile.items.map((item) => (
            <div key={item.id} className="min-w-0 space-y-1">
              <dt className="text-[13px] uppercase tracking-widest text-coco-ink/60">{localizedText(item.label, lang)}</dt>
              <dd className="break-words font-serif text-xl">{localizedText(item.value, lang)}</dd>
            </div>
          ))}
        </dl>
      </section>
    </PageLayout>
  )
}
