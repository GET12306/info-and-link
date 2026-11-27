import { useSyncExternalStore } from "react"

const storageKey = "activity-attendance-v1"
const changeEvent = "activity-attendance-change"
const empty: ReadonlySet<string> = new Set()
let savedValue: string | null = null
let savedKeys = empty
let volatileKeys: ReadonlySet<string> | undefined

function getSnapshot(): ReadonlySet<string> {
  if (volatileKeys) return volatileKeys
  try {
    const raw = window.localStorage.getItem(storageKey)
    if (raw !== savedValue) {
      const parsed: unknown = raw === null ? [] : JSON.parse(raw)
      savedKeys = Array.isArray(parsed) ? new Set(parsed.filter((key): key is string => typeof key === "string")) : empty
      savedValue = raw
    }
    return savedKeys
  } catch {
    return empty
  }
}

function subscribe(onChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === storageKey) onChange()
  }
  window.addEventListener("storage", onStorage)
  window.addEventListener(changeEvent, onChange)
  return () => {
    window.removeEventListener("storage", onStorage)
    window.removeEventListener(changeEvent, onChange)
  }
}

export function toggleAttendance(key: string) {
  const next = new Set(getSnapshot())
  if (next.has(key)) next.delete(key)
  else next.add(key)
  try {
    window.localStorage.setItem(storageKey, JSON.stringify([...next]))
    volatileKeys = undefined
  } catch {
    volatileKeys = next
  }
  window.dispatchEvent(new Event(changeEvent))
}

export function useAttendance() {
  return useSyncExternalStore(subscribe, getSnapshot, () => empty)
}
