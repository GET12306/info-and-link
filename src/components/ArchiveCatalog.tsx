import type { ReactNode } from "react"
import { ArrowLeft } from "lucide-react"
import { Link } from "react-router-dom"
import ExternalAnchor from "./ExternalAnchor"

/** Compact archive primitives, independent of the spacious event-page layout. */
export function ArchiveCatalog({ title, backLabel, children }: {
  title: string; backLabel: string; children: ReactNode
}) {
  return <div className="archive-catalog">
    <header className="catalog-header">
      <Link to="/museum" className="inline-flex items-center gap-2 text-xs text-coco-ink/60 hover:text-coco-accent"><ArrowLeft className="h-3.5 w-3.5" />{backLabel}</Link>
      <h1 className="mt-4 text-3xl font-serif sm:text-4xl">{title}</h1>
    </header>
    {children}
  </div>
}
export function CatalogGrid({ children }: { children: ReactNode }) {
  return <div className="catalog-grid">{children}</div>
}
export function CatalogEntry({ children }: { children: ReactNode }) {
  return <article className="catalog-entry">{children}</article>
}

/** Shared pill filters for archive collections. */
export function CatalogFilterBar<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: ReadonlyArray<{ value: T; label: string }>
  value: T
  onChange: (value: T) => void
}) {
  return <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
    {options.map(option => <button
      key={option.value}
      type="button"
      aria-pressed={value === option.value}
      onClick={() => onChange(option.value)}
      className={`rounded-full border px-4 py-2 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coco-accent ${value === option.value ? "border-coco-accent bg-coco-accent text-white" : "grid-line text-coco-ink/60 hover:border-coco-accent/50 hover:text-coco-accent"}`}
    >
      {option.label}
    </button>)}
  </div>
}

/** One type treatment for every archive record, linked or not. */
export function CatalogEntryTitle({ children, href, id, level = 2, suffix }: {
  children: ReactNode; href?: string; id?: string; level?: 2 | 3; suffix?: ReactNode
}) {
  const Heading = level === 2 ? "h2" : "h3"
  return <Heading id={id} className="min-w-0 break-words font-serif text-base font-normal leading-6">
    {href ? <ExternalAnchor href={href} className="inline-flex min-w-0 items-start gap-1.5 transition-colors hover:text-coco-accent">
      <span className="min-w-0">{children}</span>{suffix}
    </ExternalAnchor> : children}
  </Heading>
}


/** Smaller record titles use the same serif typography and hover treatment. */
export function CatalogItemTitle({ children, href, suffix }: {
  children: ReactNode; href?: string; suffix?: ReactNode
}) {
  return <h3 className="min-w-0 break-words font-serif text-sm font-normal leading-6">
    {href ? <ExternalAnchor href={href} className="inline-flex min-w-0 items-start gap-1.5 transition-colors hover:text-coco-accent">
      <span className="min-w-0">{children}</span>{suffix}
    </ExternalAnchor> : children}
  </h3>
}

/** Compact archive links stay neutral until the shared red hover transition. */
export function CatalogTextLink({ children, href, suffix }: {
  children: ReactNode; href: string; suffix?: ReactNode
}) {
  return <ExternalAnchor href={href} className="inline-flex min-w-0 items-start gap-1.5 text-xs leading-5 text-coco-ink/70 transition-colors hover:text-coco-accent">
    <span className="min-w-0 break-words">{children}</span>{suffix}
  </ExternalAnchor>
}

/** Native disclosure keeps archive details inline and keyboard accessible. */
export function CatalogDisclosure({ label, children, nested = false }: { label: string; children: ReactNode; nested?: boolean }) {
  return <details className="catalog-disclosure">
    <summary className={`cursor-pointer py-2 text-xs font-medium transition-colors hover:text-coco-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coco-accent ${nested ? "text-coco-ink/55" : "text-coco-ink/65"}`}>{label}</summary>
    <div className="pb-2 pt-1">{children}</div>
  </details>
}
