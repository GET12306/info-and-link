import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"
import { parse } from "yaml"

test("profile data uses an extensible localized item list", () => {
  const profile = parse(readFileSync("src/data/profile.yaml", "utf8"))
  assert.ok(profile.name.ja && profile.name.en)
  assert.ok(Array.isArray(profile.items) && profile.items.length > 0)
  assert.equal(new Set(profile.items.map(item => item.id)).size, profile.items.length)
  for (const item of profile.items) {
    assert.ok(item.id)
    assert.ok(typeof item.label === "string" || item.label.ja || item.label.en)
    assert.ok(typeof item.value === "string" || item.value.ja || item.value.en)
  }
})
