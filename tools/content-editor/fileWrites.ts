import { randomUUID } from "node:crypto"
import { rename, rm, writeFile } from "node:fs/promises"
import path from "node:path"

const pendingWrites = new Map<string, Promise<void>>()

/** Keep revision checking and replacement in the same per-file critical section. */
export async function withFileWrite<T>(file: string, operation: () => Promise<T>): Promise<T> {
  const previous = pendingWrites.get(file) ?? Promise.resolve()
  const result = previous.then(operation)
  const settled = result.then(() => {}, () => {})
  pendingWrites.set(file, settled)
  try {
    return await result
  } finally {
    if (pendingWrites.get(file) === settled) pendingWrites.delete(file)
  }
}

export async function replaceFile(file: string, source: string) {
  const temporaryPath = path.join(path.dirname(file), `.${path.basename(file)}.${randomUUID()}.tmp`)
  try {
    await writeFile(temporaryPath, source, { encoding: "utf8", flag: "wx" })
    await rename(temporaryPath, file)
  } finally {
    await rm(temporaryPath, { force: true })
  }
}
