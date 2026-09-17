type IdentifiedRecord = Record<string, unknown> & { id: string }

const MISSING = Symbol("missing")
type MergeValue = unknown | typeof MISSING

function isPlainRecord(value: MergeValue): value is Record<string, unknown> {
  return value !== MISSING && value !== null && typeof value === "object" && !Array.isArray(value)
}

function isEqual(left: MergeValue, right: MergeValue): boolean {
  if (left === MISSING || right === MISSING) return left === right
  if (Object.is(left, right)) return true
  if (Array.isArray(left) && Array.isArray(right)) {
    return left.length === right.length && left.every((value, index) => isEqual(value, right[index]))
  }
  if (isPlainRecord(left) && isPlainRecord(right)) {
    const leftKeys = Object.keys(left).sort()
    const rightKeys = Object.keys(right).sort()
    return leftKeys.length === rightKeys.length &&
      leftKeys.every((key, index) => key === rightKeys[index] && isEqual(left[key], right[key]))
  }
  return false
}

function mergeValue(
  base: MergeValue,
  local: MergeValue,
  remote: MergeValue,
  path: string
): { value: MergeValue; conflicts: string[] } {
  if (isEqual(local, base)) return { value: remote, conflicts: [] }
  if (isEqual(remote, base) || isEqual(local, remote)) return { value: local, conflicts: [] }

  if (isPlainRecord(local) && isPlainRecord(remote) &&
    (base === MISSING || isPlainRecord(base))) {
    const keys = new Set([
      ...Object.keys(base === MISSING ? {} : base),
      ...Object.keys(local),
      ...Object.keys(remote),
    ])
    const value: Record<string, unknown> = {}
    const conflicts: string[] = []

    for (const key of keys) {
      const merged = mergeValue(
        base !== MISSING && Object.hasOwn(base, key) ? base[key] : MISSING,
        Object.hasOwn(local, key) ? local[key] : MISSING,
        Object.hasOwn(remote, key) ? remote[key] : MISSING,
        `${path}.${key}`
      )
      conflicts.push(...merged.conflicts)
      if (merged.value !== MISSING) value[key] = merged.value
    }
    return { value, conflicts }
  }

  return { value: local, conflicts: [path] }
}

/**
 * Applies the user's unsaved changes to the latest copy from disk.
 * Objects merge field-by-field; arrays are treated as one value so that
 * concurrent edits to the same ordered list are never silently overwritten.
 */
export function mergeActivityDraft<T extends IdentifiedRecord>(
  baseActivities: T[],
  localActivities: T[],
  latestActivities: T[]
): { activities: T[]; conflicts: string[] } {
  const baseById = new Map(baseActivities.map((activity) => [activity.id, activity]))
  const localById = new Map(localActivities.map((activity) => [activity.id, activity]))
  const latestById = new Map(latestActivities.map((activity) => [activity.id, activity]))
  const orderedIds = [
    ...latestActivities.map((activity) => activity.id),
    ...localActivities
      .map((activity) => activity.id)
      .filter((id) => !latestById.has(id)),
  ]
  const activities: T[] = []
  const conflicts: string[] = []

  for (const id of orderedIds) {
    const merged = mergeValue(
      baseById.get(id) ?? MISSING,
      localById.get(id) ?? MISSING,
      latestById.get(id) ?? MISSING,
      id
    )
    conflicts.push(...merged.conflicts)
    if (merged.value !== MISSING) activities.push(merged.value as T)
  }

  return { activities, conflicts }
}
