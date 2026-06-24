import { useEffect, useRef } from "react"
import type { CircuitJson } from "circuit-json"

/**
 * Highlights all schematic traces on the same net when hovering any trace.
 * Builds a traceId -> netId mapping from circuit JSON, then attaches
 * mouseenter/mouseleave listeners to trace SVG elements.
 */
export const useHighlightConnectedTracesOnHover = ({
  svgDivRef,
  circuitJson,
  circuitJsonKey,
}: {
  svgDivRef: React.RefObject<HTMLDivElement | null>
  circuitJson: CircuitJson
  circuitJsonKey: string
}) => {
  const cleanupRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    const svg = svgDivRef.current
    if (!svg) return

    // Cleanup previous listeners
    cleanupRef.current?.()

    // Build traceId -> netId mapping
    const traceToNetMap = new Map<string, string>()

    try {
      const sourceTraces = (circuitJson as any[]).filter(
        (item) => item.type === "source_trace",
      )

      const schematicTraces = (circuitJson as any[]).filter(
        (item) => item.type === "schematic_trace",
      )

      // Build source_trace_id -> net connectivity
      // Two traces are on the same net if they share a connected source port
      const portToTraces = new Map<string, Set<string>>()
      const traceToPorts = new Map<string, Set<string>>()

      for (const st of sourceTraces) {
        const traceId = st.source_trace_id
        const ports = (st.connected_source_port_ids ?? []) as string[]
        traceToPorts.set(traceId, new Set(ports))
        for (const port of ports) {
          if (!portToTraces.has(port)) portToTraces.set(port, new Set())
          portToTraces.get(port)!.add(traceId)
        }
      }

      // Union-Find to group traces by net (connected through shared ports)
      const parent = new Map<string, string>()
      const find = (x: string): string => {
        if (!parent.has(x)) parent.set(x, x)
        if (parent.get(x) !== x) parent.set(x, find(parent.get(x)!))
        return parent.get(x)!
      }
      const union = (a: string, b: string) => {
        const ra = find(a)
        const rb = find(b)
        if (ra !== rb) parent.set(ra, rb)
      }

      for (const ports of traceToPorts.values()) {
        const portArr = Array.from(ports)
        for (let i = 1; i < portArr.length; i++) {
          union(portArr[0], portArr[i])
        }
      }

      // Assign net IDs (use the root of the union-find group)
      for (const st of sourceTraces) {
        const traceId = st.source_trace_id
        const netId = find(traceId)
        traceToNetMap.set(traceId, netId)
      }

      // Map schematic traces to nets
      const schematicTraceToNet = new Map<string, string>()
      for (const schTrace of schematicTraces) {
        const srcTraceId = schTrace.source_trace_id
        if (srcTraceId && traceToNetMap.has(srcTraceId)) {
          schematicTraceToNet.set(
            schTrace.schematic_trace_id,
            traceToNetMap.get(srcTraceId)!,
          )
        }
      }

      if (schematicTraceToNet.size === 0) return

      // Build netId -> set of schematic trace elements
      const netToElements = new Map<string, Element[]>()
      const allTraceElements = svg.querySelectorAll(
        '[data-circuit-json-type="schematic_trace"]',
      )

      for (const el of Array.from(allTraceElements)) {
        const traceId = el.getAttribute("data-schematic-trace-id")
        if (!traceId) continue
        const netId = schematicTraceToNet.get(traceId)
        if (!netId) continue
        if (!netToElements.has(netId)) netToElements.set(netId, [])
        netToElements.get(netId)!.push(el)
      }

      // Add hover style
      if (!svg.querySelector("style#trace-net-hover-style")) {
        const style = document.createElement("style")
        style.id = "trace-net-hover-style"
        style.textContent = `
          .trace-net-hovered path {
            stroke: #f59e0b !important;
            stroke-width: 3 !important;
            filter: drop-shadow(0 0 4px rgba(245, 158, 11, 0.6)) !important;
            transition: stroke 0.15s ease, stroke-width 0.15s ease, filter 0.15s ease;
          }
        `
        svg.appendChild(style)
      }

      const handleEnter = (netId: string) => {
        const elements = netToElements.get(netId)
        if (!elements) return
        for (const el of elements) {
          el.classList.add("trace-net-hovered")
        }
      }

      const handleLeave = (netId: string) => {
        const elements = netToElements.get(netId)
        if (!elements) return
        for (const el of elements) {
          el.classList.remove("trace-net-hovered")
        }
      }

      // Attach listeners
      const cleanups: (() => void)[] = []
      for (const [traceId, netId] of schematicTraceToNet) {
        const el = svg.querySelector(`[data-schematic-trace-id="${traceId}"]`)
        if (!el) continue

        const enterHandler = () => handleEnter(netId)
        const leaveHandler = () => handleLeave(netId)

        el.addEventListener("mouseenter", enterHandler)
        el.addEventListener("mouseleave", leaveHandler)

        // Make sure the element is hoverable
        ;(el as HTMLElement).style.cursor = "pointer"

        cleanups.push(() => {
          el.removeEventListener("mouseenter", enterHandler)
          el.removeEventListener("mouseleave", leaveHandler)
        })
      }

      cleanupRef.current = () => {
        for (const fn of cleanups) fn()
        svg.querySelector("style#trace-net-hover-style")?.remove()
      }
    } catch (err) {
      console.error("Failed to set up trace hover highlighting", err)
    }

    return () => {
      cleanupRef.current?.()
      cleanupRef.current = null
    }
  }, [svgDivRef, circuitJson, circuitJsonKey])
}
