import { useEffect, useState } from "react"
import {
  type JlcPartAvailability as Availability,
  fetchJlcPartAvailability,
} from "../utils/jlc-part-availability"

export const JlcPartAvailability = ({ partNumber }: { partNumber: string }) => {
  const [result, setResult] = useState<Availability | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()
    let active = true
    setLoading(true)
    setResult(null)
    const timeout = setTimeout(() => {
      controller.abort()
      if (active) setLoading(false)
    }, 10_000)

    fetchJlcPartAvailability(partNumber, controller.signal)
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
  }, [partNumber])

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
          {result?.price != null
            ? `$${result.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 6 })} USD / unit`
            : "Price unavailable"}
          {" · "}
          {result?.stock != null
            ? `${result.stock.toLocaleString("en-US")} in stock`
            : "Stock unavailable"}
        </>
      )}
    </span>
  )
}
