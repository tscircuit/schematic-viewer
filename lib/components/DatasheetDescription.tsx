import { useEffect, useState } from "react"
import type { PlatformConfig } from "@tscircuit/props"
import { fetchDatasheetDescription } from "../utils/datasheet-description"

export const DatasheetDescription = ({
  chipName,
  platformConfig,
}: {
  chipName: string
  platformConfig?: PlatformConfig
}) => {
  const [description, setDescription] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const platformFetch = platformConfig?.platformFetch

  useEffect(() => {
    const controller = new AbortController()
    let active = true
    setLoading(true)
    setDescription(null)
    const timeout = setTimeout(() => {
      controller.abort()
      if (active) setLoading(false)
    }, 10_000)

    Promise.resolve()
      .then(() =>
        fetchDatasheetDescription(chipName, controller.signal, platformFetch),
      )
      .then((result) => {
        if (active) setDescription(result)
      })
      .catch(() => {
        // A missing or failed datasheet lookup falls back to "-".
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
  }, [chipName, platformFetch])

  return (
    <span
      role="status"
      aria-label={`${chipName} description`}
      aria-busy={loading}
      style={loading ? { color: "#64748b" } : undefined}
    >
      {loading ? "Loading…" : (description ?? "-")}
    </span>
  )
}
