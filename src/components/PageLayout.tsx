import { ArrowLeft } from "lucide-react"
import { Link } from "react-router-dom"
import type { ReactNode } from "react"

export function PageLayout({
  children,
  compact = false,
}: {
  children: ReactNode
  compact?: boolean
}) {
  return (
    <div className={`${compact ? "space-y-12" : "space-y-20"} pb-32`}>
      {children}
    </div>
  )
}

export function PageHeader({
  title,
  subtitle,
  backLink,
  children,
}: {
  title: string
  subtitle?: string
  backLink?: { to: string; label: string }
  children?: ReactNode
}) {
  return (
    <header className={`border-b grid-line pb-12 ${backLink ? "space-y-6" : ""}`}>
      {backLink && (
        <Link
          to={backLink.to}
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-coco-ink/50 transition-colors hover:text-coco-accent"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {backLink.label}
        </Link>
      )}

      <div>
        <h1 className="mb-4 text-5xl font-serif md:text-7xl">{title}</h1>
        {subtitle && (
          <p className="text-xs uppercase tracking-widest text-coco-ink/50">{subtitle}</p>
        )}
        {children}
      </div>
    </header>
  )
}
