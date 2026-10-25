import { ChevronDown } from "lucide-react"
import type { ReactNode } from "react"

export default function ActivityDisclosureButton({ label, shortLabel = label, icon, count, open, panelId, onClick }: {
  label: string
  shortLabel?: string
  icon: ReactNode
  count?: number
  open: boolean
  panelId: string
  onClick: () => void
}) {
  return <button type="button" aria-expanded={open} aria-controls={panelId} aria-label={label} onClick={onClick} className="inline-flex min-h-9 shrink-0 cursor-pointer items-center gap-2 rounded-full border grid-line px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-coco-ink/50 transition-colors hover:border-coco-accent hover:text-coco-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coco-accent">
    {icon}
    <span className="sm:hidden">{shortLabel}</span>
    <span className="hidden sm:inline">{label}</span>
    {count !== undefined && <span className="rounded-full bg-coco-ink/5 px-1.5 py-0.5 text-[9px] leading-none">{count}</span>}
    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
  </button>
}
