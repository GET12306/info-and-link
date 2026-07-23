import type { ReactNode } from "react"

export default function EmptyState({
  title,
  description,
  icon,
}: {
  title: string
  description?: string
  icon?: ReactNode
}) {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center border grid-line bg-white/50 px-6 py-20 text-center dark:bg-neutral-900/50">
      {icon && <div className="mb-5 text-coco-accent/50">{icon}</div>}
      <p className="font-serif text-3xl text-coco-ink/30">{title}</p>
      {description && (
        <p className="mt-3 max-w-md text-sm leading-7 text-coco-ink/45">{description}</p>
      )}
    </div>
  )
}
