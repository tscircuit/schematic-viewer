import { su } from "@tscircuit/soup-util"
import type { CircuitJson } from "circuit-json"
import { useEffect, useRef } from "react"
import { type Matrix, applyToPoint } from "transformation-matrix"
import { computeTraceRoute } from "../utils/computeTraceRoute"
import type {
  EditSchematicComponentLocationEventWithElement,
  EditSchematicPortLocationEventWithElement,
  ExtendedManualEditEvent,
} from "../types/edit-events"

interface Args {
  svgDivRef: React.RefObject<HTMLDivElement | null>
  circuitJson: CircuitJson
  realToSvgProjection: Matrix
  editEvents: ExtendedManualEditEvent[]
  activeComponentEditEvent: EditSchematicComponentLocationEventWithElement | null
  activePortEditEvent: EditSchematicPortLocationEventWithElement | null
}

// Accumulated (real-mm) port offsets after applying all completed edit events
// plus the two active drags. Ports move with their component and can also be
// dragged individually.
function collectPortOffsets(
  circuitJson: CircuitJson,
  editEvents: ExtendedManualEditEvent[],
  activeComponent: EditSchematicComponentLocationEventWithElement | null,
  activePort: EditSchematicPortLocationEventWithElement | null,
): Map<string, { x: number; y: number }> {
  const offsets = new Map<string, { x: number; y: number }>()

  const applyComponentDelta = (componentId: string, dx: number, dy: number) => {
    const ports = su(circuitJson).schematic_port.list({
      schematic_component_id: componentId,
    }) as { schematic_port_id: string }[]
    for (const p of ports) {
      const prev = offsets.get(p.schematic_port_id) ?? { x: 0, y: 0 }
      offsets.set(p.schematic_port_id, { x: prev.x + dx, y: prev.y + dy })
    }
  }

  const applyPortDelta = (portId: string, dx: number, dy: number) => {
    const prev = offsets.get(portId) ?? { x: 0, y: 0 }
    offsets.set(portId, { x: prev.x + dx, y: prev.y + dy })
  }

  const events: (
    | ExtendedManualEditEvent
    | EditSchematicComponentLocationEventWithElement
    | EditSchematicPortLocationEventWithElement
  )[] = [
    ...editEvents,
    ...(activeComponent ? [activeComponent] : []),
    ...(activePort ? [activePort] : []),
  ]

  for (const ev of events) {
    if (!("edit_event_type" in ev)) continue
    if (ev.edit_event_type === "edit_schematic_component_location") {
      const dx = ev.new_center.x - ev.original_center.x
      const dy = ev.new_center.y - ev.original_center.y
      applyComponentDelta(ev.schematic_component_id, dx, dy)
    } else if (ev.edit_event_type === "edit_schematic_port_location") {
      const dx = ev.new_center.x - ev.original_center.x
      const dy = ev.new_center.y - ev.original_center.y
      applyPortDelta(ev.schematic_port_id, dx, dy)
    }
  }
  return offsets
}

/**
 * Keeps schematic traces orthogonal (L-shaped, Altium-style) whenever a
 * component or port is moved. Rewrites the trace <path> in the SVG using
 * `computeTraceRoute` so wires never end up diagonal or scribbled.
 */
export const useOrthogonalTraceReroute = ({
  svgDivRef,
  circuitJson,
  realToSvgProjection,
  editEvents,
  activeComponentEditEvent,
  activePortEditEvent,
}: Args) => {
  const lastSvgContentRef = useRef<string | null>(null)

  useEffect(() => {
    const svg = svgDivRef.current
    if (!svg) return

    const apply = () => {
      const offsets = collectPortOffsets(
        circuitJson,
        editEvents,
        activeComponentEditEvent,
        activePortEditEvent,
      )
      if (offsets.size === 0) return

      const portById = new Map<string, { center: { x: number; y: number } }>()
      for (const p of su(circuitJson).schematic_port.list() as {
        schematic_port_id: string
        center: { x: number; y: number }
      }[]) {
        portById.set(p.schematic_port_id, { center: p.center })
      }

      const resolvePortId = (
        idOrRef:
          | { from_schematic_port_id?: string; to_schematic_port_id?: string }
          | string,
      ) => (typeof idOrRef === "string" ? idOrRef : undefined)

      const traces = svg.querySelectorAll(
        '[data-circuit-json-type="schematic_trace"]',
      )

      for (const trace of Array.from(traces)) {
        const traceId = trace.getAttribute("data-schematic-trace-id")
        if (!traceId) continue
        const sch_trace = su(circuitJson).schematic_trace.get(traceId) as
          | {
              from_schematic_port_id?: string
              to_schematic_port_id?: string
            }
          | undefined
        const fromId = sch_trace
          ? (sch_trace.from_schematic_port_id ??
            resolvePortId(sch_trace as any))
          : undefined
        const toId = sch_trace?.to_schematic_port_id
        if (!fromId || !toId) continue
        // Only touch traces whose endpoints actually moved.
        const fromMoved = offsets.has(fromId)
        const toMoved = offsets.has(toId)
        if (!fromMoved && !toMoved) continue

        const fromPort = portById.get(fromId)
        const toPort = portById.get(toId)
        if (!fromPort || !toPort) continue

        const fromOffset = offsets.get(fromId) ?? { x: 0, y: 0 }
        const toOffset = offsets.get(toId) ?? { x: 0, y: 0 }
        const from = {
          x: fromPort.center.x + fromOffset.x,
          y: fromPort.center.y + fromOffset.y,
        }
        const to = {
          x: toPort.center.x + toOffset.x,
          y: toPort.center.y + toOffset.y,
        }

        const routeMm = computeTraceRoute(from, to)
        const routeSvg = routeMm.map((pt) =>
          applyToPoint(realToSvgProjection, pt),
        )
        const d = routeSvg
          .map((pt, i) => `${i === 0 ? "M" : "L"} ${pt.x} ${pt.y}`)
          .join(" ")

        const paths = trace.querySelectorAll("path")
        for (const path of Array.from(paths)) {
          if (path.getAttribute("class")?.includes("invisible")) continue
          path.setAttribute("d", d)
        }
      }
    }

    const observer = new MutationObserver(() => {
      const content = svg.innerHTML
      if (content !== lastSvgContentRef.current) {
        lastSvgContentRef.current = content
        apply()
      }
    })
    observer.observe(svg, { childList: true, subtree: false })
    apply()

    return () => observer.disconnect()
  }, [
    svgDivRef,
    circuitJson,
    realToSvgProjection,
    editEvents,
    activeComponentEditEvent,
    activePortEditEvent,
  ])
}
