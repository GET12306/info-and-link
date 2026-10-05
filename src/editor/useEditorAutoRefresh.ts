import { useEffect, useLayoutEffect, useRef } from "react"

interface RefreshOptions<T extends { revision: string }> {
  documentKey: string
  active: boolean
  dirty: boolean
  loading: boolean
  saving: boolean
  revision: string
  fetchLatest: () => Promise<T>
  onRefresh: (payload: T) => void
}

/** A background read must never replace a newer draft or a completed save. */
export function useEditorAutoRefresh<T extends { revision: string }>(options: RefreshOptions<T>) {
  const latest = useRef(options)
  useLayoutEffect(() => { latest.current = options })
  const { documentKey, active, dirty, loading, saving, revision } = options

  useEffect(() => {
    if (!active || dirty || loading || saving || !revision) return
    let cancelled = false
    let inFlight = false
    const refresh = async () => {
      if (inFlight || document.visibilityState === "hidden") return
      inFlight = true
      try {
        const payload = await latest.current.fetchLatest()
        const current = latest.current
        if (cancelled || !current.active || current.dirty || current.loading || current.saving ||
            current.documentKey !== documentKey || current.revision !== revision) return
        current.onRefresh(payload)
      } catch {
        // Manual reload and save surface connection errors without losing the draft.
      } finally {
        inFlight = false
      }
    }
    const onVisible = () => { if (document.visibilityState === "visible") void refresh() }
    void refresh()
    const interval = window.setInterval(() => void refresh(), 15_000)
    window.addEventListener("focus", refresh)
    document.addEventListener("visibilitychange", onVisible)
    return () => {
      cancelled = true
      window.clearInterval(interval)
      window.removeEventListener("focus", refresh)
      document.removeEventListener("visibilitychange", onVisible)
    }
  }, [documentKey, active, dirty, loading, saving, revision])
}

export function useUnsavedChanges(dirty: boolean) {
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (dirty) event.preventDefault() }
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [dirty])
}
