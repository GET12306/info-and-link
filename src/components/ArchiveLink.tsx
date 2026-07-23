import { ArrowRight } from "lucide-react"
import { Link } from "react-router-dom"

export default function ArchiveLink({
  to,
  title,
  description,
}: {
  to: string
  title: string
  description: string
}) {
  return (
    <div className="border-t grid-line pt-6">
      <Link
        to={to}
        className="group flex items-center justify-between gap-4 py-6 transition-opacity hover:opacity-80"
      >
        <div className="font-mono text-sm text-coco-ink/40 md:w-32">Archive</div>
        <div className="flex-1">
          <div className="mb-1 text-xl font-serif">{title}</div>
          <div className="text-sm text-coco-ink/60">{description}</div>
        </div>
        <ArrowRight className="h-4 w-4 -translate-x-2 text-coco-accent opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
      </Link>
    </div>
  )
}
