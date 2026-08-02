import { su } from "@tscircuit/soup-util"
import type { CircuitJson } from "circuit-json"
import { useEffect, useRef } from "react"
import { type Matrix, applyToPoint } from "transformation-matrix"
import { computeTraceRoute } from "../utils/computeTraceRoute"
import type {
  EditSchematicComponentLocationEventWithElement,
  EditSchematicPortLocationEventWithElement,
  EditSchematicTraceMoveEventWithElement,
  ExtendedManualEditEvent,
} from "../types/edit-events"

interface Args {
  svgDivRef: React.RefObject<HTMLDivElement | null>
  circuitJson: CircuitJson
  realToSvgProjection: Matrix
  editEvents: ExtendedManualEditEvent[]
  activeComponentEditEvent: EditSchematicComponentLocationEventWithElement | null
  activePortEditEvent: EditSchematicPortLocationEventWithElement | null
  activeTraceEditEvent: EditSchematicTraceMoveEventWithElement | null
}

type Pt = { x: number; y: number }

const EPS = 1e-3

function collectCustomRoutes(
  editEvents: ExtendedManualEditEvent[],
  active: EditSchematicTraceMoveEventWithElement | null,
): Map<string, Pt[]> {
  const routes = new Map<string, Pt[]>()
  for (const ev of editEvents) {
    if (
      "edit_event_type" in ev &&
      ev.edit_event_type === "edit_schematic_trace_move"
    ) {
      routes.set(
        ev.schematic_trace_id,
        ev.route.map((p) => ({ ...p })),
      )
    }
  }
  if (active) {
    routes.set(
      active.schematic_trace_id,
      active.route.map((p) => ({ ...p })),
    )
  }
  return routes
}

function collectPortOffsets(
  circuitJson: CircuitJson,
  editEvents: ExtendedManualEditEvent[],
  activeComponent: EditSchematicComponentLocationEventWithElement | null,
  activePort: EditSchematicPortLocationEventWithElement | null,
): Map<string, Pt> {
  const offsets = new Map<string, Pt>()

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
      if (dx || dy) applyComponentDelta(ev.schematic_component_id, dx, dy)
    } else if (ev.edit_event_type === "edit_schematic_port_location") {
      const dx = ev.new_center.x - ev.original_center.x
      const dy = ev.new_center.y - ev.original_center.y
      if (dx || dy) applyPortDelta(ev.schematic_port_id, dx, dy)
    }
  }

  return offsets
}

function applyPathD(traceEl: Element, d: string) {
  const paths = traceEl.querySelectorAll("path")
  for (const path of Array.from(paths)) {
    const cls = path.getAttribute("class") ?? ""
    if (cls.includes("crossing")) continue
    path.setAttribute("d", d)
  }
}

function near(a: Pt, b: Pt): boolean {
  return Math.abs(a.x - b.x) < EPS && Math.abs(a.y - b.y) < EPS
}

/**
 * Rewrites SVG trace paths to stay orthogonal while components/ports move,
 * and to honour in-progress / committed manual trace reshape events.
 *
 * Backend traces often omit from/to port ids — in that case we match edge
 * endpoints against port centers so wires still follow a dragged pin.
 */
export const useOrthogonalTraceReroute = ({
  svgDivRef,
  circuitJson,
  realToSvgProjection,
  editEvents,
  activeComponentEditEvent,
  activePortEditEvent,
  activeTraceEditEvent,
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
      const customRoutes = collectCustomRoutes(editEvents, activeTraceEditEvent)
      if (offsets.size === 0 && customRoutes.size === 0) return

      const portById = new Map<
        string,
        { center: Pt; schematic_port_id: string }
      >()
      const portsAtPoint: Array<{ center: Pt; id: string }> = []
      for (const p of su(circuitJson).schematic_port.list() as {
        schematic_port_id: string
        center: Pt
      }[]) {
        portById.set(p.schematic_port_id, {
          center: p.center,
          schematic_port_id: p.schematic_port_id,
        })
        portsAtPoint.push({ center: p.center, id: p.schematic_port_id })
      }

      const findPortIdAt = (pt: Pt): string | undefined => {
        for (const p of portsAtPoint) {
          if (near(p.center, pt)) return p.id
        }
        return undefined
      }

      const traces = svg.querySelectorAll(
        '[data-circuit-json-type="schematic_trace"]',
      )

      for (const trace of Array.from(traces)) {
        const traceId = trace.getAttribute("data-schematic-trace-id")
        if (!traceId) continue

        const customRoute = customRoutes.get(traceId)
        if (customRoute && customRoute.length >= 2) {
          const routeSvg = customRoute.map((pt) =>
            applyToPoint(realToSvgProjection, pt),
          )
          const d = routeSvg
            .map((pt, i) => `${i === 0 ? "M" : "L"} ${pt.x} ${pt.y}`)
            .join(" ")
          applyPathD(trace, d)
          continue
        }

        const sch_trace = su(circuitJson).schematic_trace.get(traceId) as
          | {
              from_schematic_port_id?: string
              to_schematic_port_id?: string
              edges?: { from: Pt; to: Pt }[]
            }
          | undefined

        let fromId = sch_trace?.from_schematic_port_id
        let toId = sch_trace?.to_schematic_port_id

        // Fallback: infer ports from edge endpoints (common for backend JSON).
        if ((!fromId || !toId) && sch_trace?.edges?.length) {
          const first = sch_trace.edges[0]?.from
          const last = sch_trace.edges[sch_trace.edges.length - 1]?.to
          if (first && !fromId) fromId = findPortIdAt(first)
          if (last && !toId) toId = findPortIdAt(last)
        }

        if (!fromId || !toId) continue

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
        applyPathD(trace, d)
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
    activeTraceEditEvent,
  ])
}
