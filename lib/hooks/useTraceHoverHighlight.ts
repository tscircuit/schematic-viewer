import { useEffect, useRef } from "react"
import { su } from "@tscircuit/soup-util"
import type { CircuitJson } from "circuit-json"

/**
 * Highlights all traces in the same net when hovering over a trace.
 */
export const useTraceHoverHighlight = ({
  svgDivRef,
  circuitJson,
  circuitJsonKey,
}: {
  svgDivRef: React.RefObject<HTMLDivElement | null>
  circuitJson: CircuitJson
  circuitJsonKey: string
}) => {
  const highlightedRef = useRef<{ el: Element; orig: string }[]>([])

  useEffect(() => {
    const svg = svgDivRef.current
    if (!svg) return

    const schematicTraces = su(circuitJson).schematic_trace.list()
    const sourceTraces = su(circuitJson).source_trace.list()

    // schematic_trace_id -> source_trace_id
    const schToSrc = new Map<string, string>()
    for (const t of schematicTraces) {
      if (t.source_trace_id) {
        schToSrc.set(t.schematic_trace_id, t.source_trace_id)
      }
    }

    // source_trace_id -> net ids
    const srcToNets = new Map<string, string[]>()
    for (const t of sourceTraces) {
      if (t.connected_source_net_ids?.length) {
        srcToNets.set(t.source_trace_id, t.connected_source_net_ids)
      }
    }

    // net_id -> schematic_trace_ids
    const netToTraces = new Map<string, Set<string>>()
    for (const t of schematicTraces) {
      const srcId = t.source_trace_id
      if (!srcId) continue
      const nets = srcToNets.get(srcId)
      if (!nets) continue
      for (const n of nets) {
        if (!netToTraces.has(n)) netToTraces.set(n, new Set())
        netToTraces.get(n)!.add(t.schematic_trace_id)
      }
    }

    const getPeers = (schTraceId: string): string[] => {
      const srcId = schToSrc.get(schTraceId)
      if (!srcId) return [schTraceId]
      const nets = srcToNets.get(srcId)
      if (!nets?.length) return [schTraceId]
      const peers = new Set<string>()
      for (const n of nets) {
        const ts = netToTraces.get(n)
        if (ts) ts.forEach((id) => peers.add(id))
      }
      if (peers.size === 0) peers.add(schTraceId)
      return Array.from(peers)
    }

    const clearHighlight = () => {
      for (const { el, orig } of highlightedRef.current) {
        ;(el as SVGElement).style.stroke = orig
      }
      highlightedRef.current = []
    }

    const applyHighlight = (peerIds: string[]) => {
      for (const id of peerIds) {
        const paths = svg.querySelectorAll(
          `[data-schematic-trace-id="${id}"] path`,
        )
        for (const p of Array.from(paths)) {
          if ((p as Element).getAttribute("class")?.includes("invisible"))
            continue
          highlightedRef.current.push({
            el: p,
            orig: (p as SVGElement).style.stroke,
          })
          ;(p as SVGElement).style.stroke = "#fff"
        }
      }
    }

    const onOver = (e: Event) => {
      const target = (e as MouseEvent).target as Element
      const group = target.closest('[data-circuit-json-type="schematic_trace"]')
      if (!group) return

      const id = group.getAttribute("data-schematic-trace-id")
      if (!id) return

      // if moving between traces in the same net, skip re-highlight
      const related = (e as MouseEvent).relatedTarget as Element | null
      if (related) {
        const prev = related.closest(
          '[data-circuit-json-type="schematic_trace"]',
        )
        if (prev) {
          const prevId = prev.getAttribute("data-schematic-trace-id")
          if (prevId) {
            const prevPeers = getPeers(prevId)
            if (prevPeers.includes(id)) return
          }
        }
      }

      clearHighlight()
      applyHighlight(getPeers(id))
    }

    const onOut = (e: Event) => {
      const related = (e as MouseEvent).relatedTarget as Element | null
      if (related) {
        const next = related.closest(
          '[data-circuit-json-type="schematic_trace"]',
        )
        if (next) {
          const nextId = next.getAttribute("data-schematic-trace-id")
          const target = (e as MouseEvent).target as Element
          const current = target.closest(
            '[data-circuit-json-type="schematic_trace"]',
          )
          const currentId = current?.getAttribute("data-schematic-trace-id")
          if (nextId && currentId) {
            const peers = getPeers(currentId)
            if (peers.includes(nextId)) return
          }
        }
      }
      clearHighlight()
    }

    svg.addEventListener("mouseover", onOver)
    svg.addEventListener("mouseout", onOut)

    return () => {
      svg.removeEventListener("mouseover", onOver)
      svg.removeEventListener("mouseout", onOut)
      clearHighlight()
    }
  }, [svgDivRef, circuitJson, circuitJsonKey])
}
