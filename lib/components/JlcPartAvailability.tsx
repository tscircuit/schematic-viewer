import { useEffect, useState } from "react"
import {
  type JlcPartAvailability as Availability,
  fetchJlcPartAvailability,
} from "../utils/jlc-part-availability"
import type { PlatformConfig } from "@tscircuit/props"

const formatPrice = (availability: Availability | null) => {
  if (availability?.price == null) return "Price unavailable"
  const options = { minimumFractionDigits: 2, maximumFractionDigits: 6 }
  if (availability.currency === null) {
    return availability.price.toLocaleString("en-US", options)
  }
  return availability.price.toLocaleString("en-US", {
    ...options,
    style: "currency",
    currency: availability.currency ?? "USD",
  })
}

export const JlcPartAvailability = ({
  partNumber,
  platformConfig,
}: {
  partNumber: string
  platformConfig?: PlatformConfig
}) => {
  const [result, setResult] = useState<Availability | null>(null)
  const [loading, setLoading] = useState(true)
  const partsEngine = platformConfig?.partsEngine
  const platformFetch = platformConfig?.platformFetch

  useEffect(() => {
    const controller = new AbortController()
    let active = true
    setLoading(true)
    setResult(null)
    const timeout = setTimeout(() => {
      controller.abort()
      if (active) setLoading(false)
    }, 10_000)

    Promise.resolve()
      .then(async () => {
        if (partsEngine?.fetchPartAvailability) {
          // A provider's missing result is authoritative, so local catalogs
          // can leave inventory unknown without triggering a fallback request.
          return (
            (await partsEngine.fetchPartAvailability({
              supplierName: "jlcpcb",
              supplierPartNumber: partNumber,
              signal: controller.signal,
              platformFetch,
            })) ?? null
          )
        }
        return fetchJlcPartAvailability(
          partNumber,
          controller.signal,
          platformFetch,
        )
      })
      .then((availability) => {
        if (active) setResult(availability)
      })
      .catch(() => {
        // A failed lookup should leave the component details usable.
      })
      .finally(() => {
        clearTimeout(timeout)
        if (active) setLoading(false)
      })

    return () => {
      active = false
      clearTimeout(timeout)
      controller.abort()
    }
  }, [partNumber, partsEngine, platformFetch])

  return (
    <span
      role="status"
      aria-label={`${partNumber} price and stock`}
      aria-busy={loading}
      style={{ display: "block", color: "#64748b", marginTop: "2px" }}
    >
      {loading ? (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
            <circle
              cx="6"
              cy="6"
              r="4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray="18 8"
            >
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="0 6 6"
                to="360 6 6"
                dur="1s"
                repeatCount="indefinite"
              />
            </circle>
          </svg>
          Loading price and stock…
        </span>
      ) : (
        <>
          <span style={{ display: "block" }}>{formatPrice(result)}</span>
          <span style={{ display: "block" }}>
            {result?.stock != null
              ? `${result.stock.toLocaleString("en-US")} in stock`
              : "Stock unavailable"}
          </span>
        </>
      )}
    </span>
  )
}
