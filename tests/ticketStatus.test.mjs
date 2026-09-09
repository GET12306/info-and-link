import assert from "node:assert/strict"
import { after, test } from "node:test"
import { createServer } from "vite"

const server = await createServer({
  configFile: false,
  server: { middlewareMode: true, ws: false, watch: null },
  optimizeDeps: { noDiscovery: true, include: [] },
  appType: "custom",
})
after(() => server.close())

const { getTicketStatus } = await server.ssrLoadModule("/src/utils/ticketStatus.ts")
const entry = {
  type: { ja: "一般発売", en: "General Sale" },
  scheduleLabel: "2026.09.10-09.12",
  startAt: "2026-09-10",
  endAt: "2026-09-12",
}

test("date-only ticket boundaries default to the start and end of their JST days", () => {
  assert.equal(getTicketStatus(entry, "2026-09-09T23:59"), "upcoming")
  assert.equal(getTicketStatus(entry, "2026-09-10T00:00"), "open")
  assert.equal(getTicketStatus(entry, "2026-09-12T23:59"), "open")
  assert.equal(getTicketStatus(entry, "2026-09-13T00:00"), "past")
})

test("the same fields honor minute-precise values when T and a time are present", () => {
  const precise = {
    ...entry,
    startAt: "2026-09-10T12:00",
    endAt: "2026-09-12T18:30",
  }
  assert.equal(getTicketStatus(precise, "2026-09-10T11:59"), "upcoming")
  assert.equal(getTicketStatus(precise, "2026-09-10T12:00"), "open")
  assert.equal(getTicketStatus(precise, "2026-09-12T18:31"), "past")
})
