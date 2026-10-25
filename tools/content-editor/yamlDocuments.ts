import { isMap, isSeq, parseDocument, Scalar, visit, type Document, type YAMLSeq } from "yaml"

export function parseListDocument(source: string) {
  const document = parseDocument(source)
  if (document.errors.length > 0) {
    throw new Error(document.errors.map((error) => error.message).join("\n"))
  }
  const activities = document.toJS() as unknown
  if (!Array.isArray(activities) || !isSeq(document.contents)) {
    throw new Error("YAML 的根节点必须是数组")
  }
  return { document, activities }
}

function updateSequence(
  document: Document.Parsed,
  sequence: YAMLSeq<unknown>,
  currentActivities: unknown[],
  nextActivities: unknown[]
) {
  const currentById = new Map<string, { data: unknown; node: unknown }>()
  currentActivities.forEach((activity, index) => {
    if (activity && typeof activity === "object" && "id" in activity) {
      currentById.set(String(activity.id), {
        data: activity,
        node: sequence.items[index],
      })
    }
  })

  // Inserting an id-less performance must not consume another unchanged row's node.
  const unchangedNodes = new Set(currentActivities.flatMap((current, index) =>
    nextActivities.some(next => JSON.stringify(current) === JSON.stringify(next)) ? [sequence.items[index]] : []))
  const usedNodes = new Set<unknown>()
  sequence.items = nextActivities.map((activity, index) => {
    const id = activity && typeof activity === "object" && "id" in activity
      ? String(activity.id)
      : ""
    const existing = currentById.get(id)
    const matchingIndex = currentActivities.findIndex((current, currentIndex) =>
      !usedNodes.has(sequence.items[currentIndex]) && JSON.stringify(current) === JSON.stringify(activity)
    )
    if (matchingIndex >= 0) {
      const matchingNode = sequence.items[matchingIndex]
      usedNodes.add(matchingNode)
      return matchingNode
    }
    if (existing && JSON.stringify(existing.data) === JSON.stringify(activity)) {
      usedNodes.add(existing.node)
      return existing.node as never
    }

    const fallbackNode = existing?.node ?? sequence.items[index]
    const nextNode = document.createNode(activity)
    visit(nextNode, {
      Scalar(key, node) {
        if (key !== "key" && typeof node.value === "string") {
          node.type = Scalar.QUOTE_DOUBLE
        }
      },
    })
    if (fallbackNode && !usedNodes.has(fallbackNode) && !unchangedNodes.has(fallbackNode)) {
      const previous = fallbackNode as {
        comment?: string | null
        commentBefore?: string | null
        spaceBefore?: boolean
      }
      const replacement = nextNode as typeof previous
      replacement.comment = previous.comment
      replacement.commentBefore = previous.commentBefore
      replacement.spaceBefore = previous.spaceBefore
      usedNodes.add(fallbackNode)
    }
    return nextNode as never
  })
}

export function updateListDocument(source: string, nextActivities: unknown[]) {
  const { document, activities: currentActivities } = parseListDocument(source)
  if (JSON.stringify(currentActivities) === JSON.stringify(nextActivities)) return source
  if (!isSeq(document.contents)) throw new Error("YAML 的根节点必须是数组")
  updateSequence(document, document.contents, currentActivities, nextActivities)

  return document.toString({ lineWidth: 0 })
}

function parseCollectionDocument(source: string, key: string) {
  const document = parseDocument(source)
  if (document.errors.length) throw new Error(document.errors.map(error => error.message).join("\n"))
  const value = document.toJS() as Record<string, unknown>
  const node = document.get(key, true)
  if (!value || !isMap(document.contents) || !Array.isArray(value[key]) || !isSeq(node)) {
    throw new Error(`YAML 必须包含 ${key} 数组`)
  }
  return { document, value, node, items: value[key] as unknown[] }
}

function updateCollectionDocument(source: string, key: string, items: unknown[]) {
  const parsed = parseCollectionDocument(source, key)
  if (JSON.stringify(parsed.items) === JSON.stringify(items)) return source
  updateSequence(parsed.document, parsed.node, parsed.items, items)
  return parsed.document.toString({ lineWidth: 0 })
}

export function parseVenueDocument(source: string) {
  const parsed = parseCollectionDocument(source, "venues")
  return { document: parsed.document, value: parsed.value, venues: parsed.items, venueNode: parsed.node }
}

export function updateVenueDocument(source: string, venues: unknown[]) {
  return updateCollectionDocument(source, "venues", venues)
}

export function parsePerformanceDocument(source: string) {
  return parseCollectionDocument(source, "performances").items
}

export function updatePerformanceDocument(source: string, performances: unknown[]) {
  return updateCollectionDocument(source, "performances", performances)
}

export const parseActivityDocument = parseListDocument
export const updateActivityDocument = updateListDocument
