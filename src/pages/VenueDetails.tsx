import { useState, type ReactNode } from "react"
import { useParams } from "react-router-dom"
import { Building2, Check, Copy, ExternalLink, MapPinned, Train, Users } from "lucide-react"
import ExternalAnchor from "../components/ExternalAnchor"
import { PageHeader, PageLayout } from "../components/PageLayout"
import {
  getVenue,
  getVenueAddress,
  getVenueMapUrl,
  getVenueName,
  getVenueNavigationText,
} from "../data/venues"
import type { Language, LocalizedText, Venue } from "../types"

function localize(value: LocalizedText | undefined, lang: Language) {
  return value?.[lang] || value?.ja || value?.en || ""
}

function capacityItems(venue: Venue, lang: Language) {
  if (!venue.capacity) return []
  const labels = lang === "ja"
    ? { seated: "着席", standing: "スタンディング", maximum: "最大", wheelchairSpaces: "車いす席", temporarySeats: "仮設席" }
    : { seated: "Seated", standing: "Standing", maximum: "Maximum", wheelchairSpaces: "Wheelchair spaces", temporarySeats: "Temporary seats" }
  return (Object.keys(labels) as Array<keyof typeof labels>).flatMap((key) =>
    typeof venue.capacity?.[key] === "number"
      ? [{ label: labels[key], value: Number(venue.capacity[key]).toLocaleString() }]
      : []
  )
}

function spaceSummary(space: Record<string, unknown>, lang: Language) {
  const rawName = space.name
  const name = typeof rawName === "string"
    ? rawName
    : rawName && typeof rawName === "object"
      ? localize(rawName as LocalizedText, lang)
      : ""
  const details = [
    typeof space.capacity === "number"
      ? (lang === "ja" ? space.capacity.toLocaleString() + "名" : space.capacity.toLocaleString() + " people")
      : "",
    typeof space.areaSquareMeters === "number"
      ? space.areaSquareMeters.toLocaleString() + " m²"
      : "",
  ].filter(Boolean)
  return [name, ...details].filter(Boolean).join(" · ")
}

function DetailCard({ icon: Icon, title, children }: {
  icon: typeof MapPinned
  title: string
  children: ReactNode
}) {
  return (
    <section className="rounded-lg border grid-line p-5 md:p-6">
      <h2 className="mb-4 flex items-center gap-2 text-sm font-sans font-bold uppercase tracking-[0.18em] text-coco-accent">
        <Icon className="h-4 w-4" aria-hidden="true" />
        {title}
      </h2>
      {children}
    </section>
  )
}

export default function VenueDetails({ lang }: { lang: Language }) {
  const { venueId = "" } = useParams()
  const venue = getVenue(venueId)
  const [copied, setCopied] = useState<"name" | "address" | null>(null)

  if (!venue) {
    return (
      <PageLayout compact>
        <PageHeader
          title={lang === "ja" ? "会場が見つかりません" : "Venue not found"}
          backLink={{ to: "/activities", label: lang === "ja" ? "活動情報へ戻る" : "Back to events" }}
        />
        <p className="text-sm leading-7 text-coco-ink/60">
          {lang === "ja" ? "指定された会場IDは登録されていません。" : "The requested venue ID is not registered."}
        </p>
      </PageLayout>
    )
  }

  const address = getVenueAddress(venue, lang)
  const capacities = capacityItems(venue, lang)
  const copyButton = async (kind: "name" | "address", value: string) => {
    await navigator.clipboard.writeText(value)
    setCopied(kind)
    window.setTimeout(() => setCopied((current) => current === kind ? null : current), 1800)
  }
  return (
    <PageLayout compact>
      <PageHeader
        title={getVenueName(venue, lang)}
        subtitle={venue.formalName ? localize(venue.formalName, lang) : undefined}
        backLink={{ to: "/activities", label: lang === "ja" ? "活動情報へ戻る" : "Back to events" }}
      >
        {venue.status && (
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-coco-accent/30 bg-coco-accent/5 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-coco-accent">
              {venue.status === "closed" ? (lang === "ja" ? "営業終了" : "Closed") : (lang === "ja" ? "過去の会場" : "Historical venue")}
            </span>
          </div>
        )}
      </PageHeader>

      <section className="rounded-xl border grid-line bg-coco-ink/[0.02] p-5 dark:bg-white/[0.025] md:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-coco-ink/40">
              {lang === "ja" ? "地図・ナビ用" : "For maps and navigation"}
            </p>
            <p className="break-words font-serif text-xl leading-relaxed">{venue.name.ja || venue.name.en}</p>
            {address && <p className="mt-2 text-sm leading-6 text-coco-ink/55">{address}</p>}
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <button type="button" onClick={() => void copyButton("name", venue.name.ja || venue.name.en)}
              className="inline-flex min-h-10 items-center gap-2 rounded-full border grid-line px-4 text-xs font-bold transition-colors hover:border-coco-accent hover:text-coco-accent">
              {copied === "name" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied === "name" ? (lang === "ja" ? "コピーしました" : "Copied") : (lang === "ja" ? "会場名をコピー" : "Copy venue name")}
            </button>
            <ExternalAnchor
              href={getVenueMapUrl(venue)}
              className="inline-flex min-h-10 items-center gap-2 rounded-full bg-coco-accent px-4 text-xs font-bold text-white transition-opacity hover:opacity-80"
            >
              <MapPinned className="h-4 w-4" />
              {lang === "ja" ? "地図で開く" : "Open in Maps"}
            </ExternalAnchor>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <DetailCard icon={MapPinned} title={lang === "ja" ? "所在地" : "Location"}>
          {address ? (
            <>
              <p className="text-sm leading-7">{address}</p>
              <button type="button" onClick={() => void copyButton("address", getVenueNavigationText(venue))}
                className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-coco-accent transition-opacity hover:opacity-70">
                {copied === "address" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied === "address" ? (lang === "ja" ? "コピーしました" : "Copied") : (lang === "ja" ? "名称と住所をコピー" : "Copy name and address")}
              </button>
            </>
          ) : <p className="text-sm text-coco-ink/45">{localize(venue.address.note, lang)}</p>}
        </DetailCard>

        <DetailCard icon={Users} title={lang === "ja" ? "収容情報" : "Capacity"}>
          {capacities.length > 0 ? (
            <dl className="grid grid-cols-2 gap-4">
              {capacities.map((item) => (
                <div key={item.label}>
                  <dt className="text-[10px] uppercase tracking-wider text-coco-ink/40">{item.label}</dt>
                  <dd className="mt-1 text-xl font-serif">{item.value}</dd>
                </div>
              ))}
            </dl>
          ) : <p className="text-sm text-coco-ink/45">{lang === "ja" ? "固定の収容人数情報はありません。" : "No fixed capacity is listed."}</p>}
          {venue.capacity?.note && <p className="mt-4 text-xs leading-6 text-coco-ink/50">{localize(venue.capacity.note, lang)}</p>}
        </DetailCard>

        <DetailCard icon={Train} title={lang === "ja" ? "交通" : "Transport"}>
          {venue.transport?.length ? (
            <ul className="space-y-3">
              {venue.transport.map((item, index) => (
                <li key={index} className="text-sm leading-6">
                  <span className="font-medium">{localize(item.station, lang)}</span>
                  {item.line && <span className="text-coco-ink/45"> · {localize(item.line, lang)}</span>}
                  {item.exit && <span className="text-coco-ink/45"> · {typeof item.exit === "string" ? item.exit : localize(item.exit, lang)}</span>}
                  {item.connected && <span className="text-coco-ink/45"> · {lang === "ja" ? "直結" : "Direct connection"}</span>}
                  {item.walkingMinutes !== undefined && <span className="text-coco-ink/45"> · {lang === "ja" ? "徒歩" + item.walkingMinutes + "分" : item.walkingMinutes + " min walk"}</span>}
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-coco-ink/45">{lang === "ja" ? "交通情報は公式サイトで確認してください。" : "Check the official site for transport details."}</p>}
        </DetailCard>

        <DetailCard icon={Building2} title={lang === "ja" ? "会場情報" : "Venue information"}>
          <dl className="space-y-3 text-sm leading-6">
            {venue.formerName && <div><dt className="text-xs text-coco-ink/40">{lang === "ja" ? "旧称" : "Former name"}</dt><dd>{localize(venue.formerName, lang)}</dd></div>}
            {venue.aliases?.[lang]?.length ? <div><dt className="text-xs text-coco-ink/40">{lang === "ja" ? "別名" : "Also known as"}</dt><dd>{venue.aliases[lang]?.join(" / ")}</dd></div> : null}
            {venue.closedOn && <div><dt className="text-xs text-coco-ink/40">{lang === "ja" ? "営業終了日" : "Closed on"}</dt><dd>{venue.closedOn}</dd></div>}
          </dl>
          {venue.spaces?.length ? (
            <div className="mt-4 border-t grid-line pt-4">
              <p className="mb-2 text-xs text-coco-ink/40">{lang === "ja" ? "ホール・区画" : "Halls and spaces"}</p>
              <ul className="space-y-1 text-sm leading-6">
                {venue.spaces.map((space, index) => <li key={index}>{spaceSummary(space, lang)}</li>)}
              </ul>
            </div>
          ) : null}
          {venue.notes?.map((note, index) => note.text && (
            <p key={index} className="mt-4 text-xs leading-6 text-coco-ink/50">
              {note.effectiveFrom && <span>{note.effectiveFrom} · </span>}
              {localize(note.text, lang)}
            </p>
          ))}
          <ExternalAnchor href={venue.officialUrl}
            className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-coco-accent transition-opacity hover:opacity-70">
            {lang === "ja" ? "公式サイト" : "Official site"} <ExternalLink className="h-3.5 w-3.5" />
          </ExternalAnchor>
        </DetailCard>
      </div>

      <section className="border-t grid-line pt-8">
        <h2 className="mb-4 text-sm font-sans font-bold uppercase tracking-[0.18em] text-coco-ink/45">{lang === "ja" ? "情報源" : "Sources"}</h2>
        <ul className="space-y-2">
          {venue.sources.map((source) => (
            <li key={source.url}>
              <ExternalAnchor href={source.url}
                className="inline-flex items-start gap-2 text-sm leading-6 text-coco-ink/60 transition-colors hover:text-coco-accent">
                <ExternalLink className="mt-1 h-3.5 w-3.5 shrink-0" />
                {source.label}
              </ExternalAnchor>
            </li>
          ))}
        </ul>
      </section>
    </PageLayout>
  )
}
