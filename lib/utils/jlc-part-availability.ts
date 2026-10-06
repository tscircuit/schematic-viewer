export interface JlcPartAvailability {
  price: number | null
  stock: number | null
}

const nonNegativeNumber = (value: unknown): number | null => {
  if (typeof value !== "number" && typeof value !== "string") return null
  if (typeof value === "string" && !value.trim()) return null
  const number = Number(value)
  return Number.isFinite(number) && number >= 0 ? number : null
}

const getPrice = (value: unknown): number | null => {
  const number = nonNegativeNumber(value)
  if (number !== null) return number
  if (typeof value !== "string") return null
  try {
    const tiers = JSON.parse(value)
    if (Array.isArray(tiers)) {
      return nonNegativeNumber(tiers[0]?.price)
    }
  } catch {
    // Older catalog entries store quantity ranges as "1-9:0.02,10-99:0.01".
    const tiers = value
      .split(",")
      .map((tier) => {
        const [quantity, price] = tier.split(":")
        return {
          quantity: nonNegativeNumber(quantity?.split("-")[0]),
          price: nonNegativeNumber(price),
        }
      })
      .filter((tier) => tier.quantity !== null && tier.price !== null)
      .sort((a, b) => a.quantity! - b.quantity!)
    return tiers[0]?.price ?? null
  }
  return null
}

export const fetchJlcPartAvailability = async (
  partNumber: string,
  signal: AbortSignal,
): Promise<JlcPartAvailability | null> => {
  const response = await fetch(
    `https://jlcsearch.tscircuit.com/api/search?q=${encodeURIComponent(partNumber)}&limit=1`,
    { signal, cache: "no-store" },
  )
  if (!response.ok) throw new Error("JLC part lookup failed")
  const data = await response.json()
  if (!Array.isArray(data?.components)) return null
  const part = data.components.find(
    (component: { lcsc?: unknown } | null) =>
      component &&
      String(component.lcsc).replace(/^c/i, "") ===
        partNumber.replace(/^c/i, ""),
  )
  if (!part) return null
  return {
    price: nonNegativeNumber(part.price1) ?? getPrice(part.price),
    stock: nonNegativeNumber(part.stock),
  }
}
