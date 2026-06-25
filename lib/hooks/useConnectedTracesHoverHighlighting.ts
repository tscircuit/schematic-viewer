import type { CircuitJson } from "circuit-json"
import { useEffect, useRef } from "react"
import { findConnectedTraceIds } from "../utils/trace-connectivity"

export const useConnectedTracesHoverHighlighting = ({
  svgDivRef,
  circuitJson,
  enabled = true,
}: {
  svgDivRef: React.RefObject<HTMLDivElement | null>
  circuitJson: CircuitJson
  enabled?: boolean
}) => {
  const highlightedIdsRef = useRef<Set<string>>(new Set())
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!enabled) return
    const container = svgDivRef.current
    if (!container) return

    const highlightId = (id: string) =>
      container
        .querySelectorAll(`[data-schematic-trace-id="${id}"]`)
        .forEach((el) => el.classList.add("trace-highlighted"))

    const unhighlightId = (id: string) =>
      container
        .querySelectorAll(`[data-schematic-trace-id="${id}"]`)
        .forEach((el) => el.classList.remove("trace-highlighted"))

    const clearAll = () => {
      highlightedIdsRef.current.forEach(unhighlightId)
      highlightedIdsRef.current.clear()
    }

    const onEnter = (e: Event) => {
      const traceGroup = (e.target as Element).closest(
        "[data-schematic-trace-id]",
      )
      if (!traceGroup) return
      const id = traceGroup.getAttribute("data-schematic-trace-id")
      if (!id) return

      if (leaveTimerRef.current) {
        clearTimeout(leaveTimerRef.current)
        leaveTimerRef.current = null
      }

      clearAll()
      findConnectedTraceIds(circuitJson, id).forEach((connId) => {
        highlightId(connId)
        highlightedIdsRef.current.add(connId)
      })
    }

    const onLeave = () => {
      leaveTimerRef.current = setTimeout(clearAll, 50)
    }

    const injectStyles = () => {
      if (container.querySelector("style#trace-hover-styles")) return
      const style = document.createElement("style")
      style.id = "trace-hover-styles"
      style.textContent = `
        .trace-highlighted path,
        .trace-highlighted circle {
          stroke: #ff6b35 !important;
          filter: drop-shadow(0 0 3px rgba(255,107,53,0.6)) !important;
          transition: stroke 0.15s ease-in-out, filter 0.15s ease-in-out !important;
        }
        [data-schematic-trace-id] { cursor: pointer; }
      `
      container.appendChild(style)
    }

    const attach = () => {
      injectStyles()
      container.querySelectorAll("[data-schematic-trace-id]").forEach((el) => {
        el.addEventListener("mouseenter", onEnter)
        el.addEventListener("mouseleave", onLeave)
      })
    }

    const detach = () =>
      container.querySelectorAll("[data-schematic-trace-id]").forEach((el) => {
        el.removeEventListener("mouseenter", onEnter)
        el.removeEventListener("mouseleave", onLeave)
      })

    attach()

    const observer = new MutationObserver(() => {
      detach()
      attach()
    })
    observer.observe(container, { childList: true, subtree: true })

    return () => {
      observer.disconnect()
      detach()
      if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current)
      clearAll()
    }
  }, [svgDivRef, circuitJson, enabled])
}
