import { afterEach, expect, test } from "bun:test"
import {
  fetchDatasheetDescription,
  getDescriptionPreview,
} from "../lib/utils/datasheet-description"

const originalFetch = globalThis.fetch
afterEach(() => {
  globalThis.fetch = originalFetch
})

test("description previews stop at 140 characters without splitting Unicode", () => {
  expect(getDescriptionPreview("Short description")).toBe("Short description")
  expect(getDescriptionPreview("x".repeat(140))).toHaveLength(140)
  expect(getDescriptionPreview("x".repeat(139) + "🔌" + "more")).toBe(
    "x".repeat(139) + "🔌",
  )
})

test("looks up the manufacturer part number and reads the datasheet description", async () => {
  const controller = new AbortController()
  globalThis.fetch = (async (url, options) => {
    expect(String(url)).toBe(
      "https://api.tscircuit.com/datasheets/get?chip_name=ABC%2F123%20%2B",
    )
    expect(options?.signal).toBe(controller.signal)
    return Response.json({
      datasheet: { ai_description: "  A useful chip description  " },
    })
  }) as typeof fetch
  expect(await fetchDatasheetDescription("ABC/123 +", controller.signal)).toBe(
    "A useful chip description",
  )
})

test("missing datasheets and empty or invalid descriptions are omitted", async () => {
  for (const data of [
    {},
    { datasheet: null },
    { datasheet: {} },
    { datasheet: { ai_description: null } },
    { datasheet: { ai_description: "   " } },
    { datasheet: { ai_description: 42 } },
  ]) {
    globalThis.fetch = (async () => Response.json(data)) as typeof fetch
    expect(
      await fetchDatasheetDescription("unknown", new AbortController().signal),
    ).toBeUndefined()
  }
  globalThis.fetch = (async () =>
    new Response(null, { status: 404 })) as typeof fetch
  expect(
    await fetchDatasheetDescription("unknown", new AbortController().signal),
  ).toBeUndefined()
})

test("ignores a late response after the menu request is cancelled", async () => {
  const controller = new AbortController()
  let resolve!: (response: Response) => void
  globalThis.fetch = (() =>
    new Promise<Response>((done) => {
      resolve = done
    })) as typeof fetch
  const request = fetchDatasheetDescription("RP2040", controller.signal)
  controller.abort()
  resolve(Response.json({ datasheet: { ai_description: "Old selection" } }))
  expect(await request).toBeUndefined()
})
