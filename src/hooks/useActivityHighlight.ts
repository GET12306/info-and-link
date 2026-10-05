import { useEffect, useState } from "react"

export function useActivityHighlight(activityId: string | undefined, prefix: string, navigationState: unknown) {
  const [highlighted, setHighlighted] = useState<string | null>(null)
  useEffect(() => {
    if (!activityId) return
    let timeout: number | undefined
    const frame = requestAnimationFrame(() => {
      const element = document.getElementById(`${prefix}${activityId}`)
      if (!element) return
      element.scrollIntoView({ behavior: "smooth", block: "center" })
      setHighlighted(activityId)
      timeout = window.setTimeout(() => setHighlighted(null), 2000)
    })
    return () => {
      cancelAnimationFrame(frame)
      window.clearTimeout(timeout)
    }
  }, [activityId, prefix, navigationState])
  return highlighted
}
