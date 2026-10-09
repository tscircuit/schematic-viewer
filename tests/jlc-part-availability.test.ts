import { afterEach, expect, test } from "bun:test"
import { fetchJlcPartAvailability } from "../lib/utils/jlc-part-availability"

const originalFetch = globalThis.fetch
afterEach(() => {
  globalThis.fetch = originalFetch
})

const lookup = (components: unknown[]) => {
  globalThis.fetch = (async () =>
    Response.json({ components })) as unknown as typeof fetch
  return fetchJlcPartAvailability("C1525", new AbortController().signal)
}

test("JLC prices support numeric, price1, JSON tiers, and legacy quantity ranges", async () => {
  for (const fields of [
    { price: 0.006 },
    { price1: 0.006, price: "bad" },
    { price: '[{"qFrom":1,"price":0.006},{"qFrom":10,"price":0.001}]' },
    { price: "10-99:0.001,1-9:0.006" },
  ]) {
    expect(await lookup([{ lcsc: 1525, stock: 0, ...fields }])).toEqual({
      price: 0.006,
      stock: 0,
    })
  }
})

test("missing, mismatched, and malformed JLC data stays unavailable", async () => {
  expect(await lookup([])).toBeNull()
  expect(await lookup([{ lcsc: 2040, price: 100, stock: 1 }])).toBeNull()
  expect(
    await lookup([null, { lcsc: 1525, price: null, stock: null }]),
  ).toEqual({ price: null, stock: null })
  expect(await lookup([{ lcsc: 1525, price: "invalid", stock: -1 }])).toEqual({
    price: null,
    stock: null,
  })
})

test("JLC lookup uses platformFetch with the requested part and abort signal", async () => {
  globalThis.fetch = (() => {
    throw new Error("A configured platformFetch must replace native fetch")
  }) as unknown as typeof fetch
  const controller = new AbortController()
  const requests: Array<{ input: unknown; init?: RequestInit }> = []
  const platformFetch = (async (
    input: RequestInfo | URL,
    init?: RequestInit,
  ) => {
    requests.push({ input, init })
    return Response.json({
      components: [{ lcsc: 1525, price: 0.03, stock: 150 }],
    })
  }) as typeof fetch
  expect(
    await fetchJlcPartAvailability("C1525", controller.signal, platformFetch),
  ).toEqual({ price: 0.03, stock: 150 })
  expect(requests).toHaveLength(1)
  expect(String(requests[0]!.input)).toBe(
    "https://jlcsearch.tscircuit.com/api/search?q=C1525&limit=1",
  )
  expect(requests[0]!.init?.signal).toBe(controller.signal)
  expect(requests[0]!.init?.cache).toBe("no-store")
})
