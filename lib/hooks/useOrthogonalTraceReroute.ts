import { su } from "@tscircuit/soup-util"
import type { CircuitJson } from "circuit-json"
import { useEffect, useRef } from "react"
import { type Matrix, applyToPoint } from "transformation-matrix"
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

function ptKey(p: Pt): string {
  return `${p.x.toFixed(5)},${p.y.toFixed(5)}`
}

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

/** Port original centers + net delta after component/port drags. */
function collectMovedPorts(
  circuitJson: CircuitJson,
  editEvents: ExtendedManualEditEvent[],
  activeComponent: EditSchematicComponentLocationEventWithElement | null,
  activePort: EditSchematicPortLocationEventWithElement | null,
): Array<{ x: number; y: number; dx: number; dy: number }> {
  const offsetByPortId = new Map<string, Pt>()

  const addComponentDelta = (componentId: string, dx: number, dy: number) => {
    const ports = su(circuitJson).schematic_port.list({
      schematic_component_id: componentId,
    }) as { schematic_port_id: string }[]
    for (const p of ports) {
      const prev = offsetByPortId.get(p.schematic_port_id) ?? { x: 0, y: 0 }
      offsetByPortId.set(p.schematic_port_id, {
        x: prev.x + dx,
        y: prev.y + dy,
      })
    }
  }

  const addPortDelta = (portId: string, dx: number, dy: number) => {
    const prev = offsetByPortId.get(portId) ?? { x: 0, y: 0 }
    offsetByPortId.set(portId, { x: prev.x + dx, y: prev.y + dy })
  }

  for (const ev of [
    ...editEvents,
    ...(activeComponent ? [activeComponent] : []),
    ...(activePort ? [activePort] : []),
  ]) {
    if (!("edit_event_type" in ev)) continue
    if (ev.edit_event_type === "edit_schematic_component_location") {
      const dx = ev.new_center.x - ev.original_center.x
      const dy = ev.new_center.y - ev.original_center.y
      if (dx || dy) addComponentDelta(ev.schematic_component_id, dx, dy)
    } else if (ev.edit_event_type === "edit_schematic_port_location") {
      const dx = ev.new_center.x - ev.original_center.x
      const dy = ev.new_center.y - ev.original_center.y
      if (dx || dy) addPortDelta(ev.schematic_port_id, dx, dy)
    }
  }

  if (offsetByPortId.size === 0) return []

  const moved: Array<{ x: number; y: number; dx: number; dy: number }> = []
  for (const p of su(circuitJson).schematic_port.list() as {
    schematic_port_id: string
    center: Pt
  }[]) {
    const o = offsetByPortId.get(p.schematic_port_id)
    if (!o || (Math.abs(o.x) < EPS && Math.abs(o.y) < EPS)) continue
    if (!p.center) continue
    moved.push({ x: p.center.x, y: p.center.y, dx: o.x, dy: o.y })
  }
  return moved
}

function getPortDelta(
  p: Pt,
  movedPorts: Array<{ x: number; y: number; dx: number; dy: number }>,
): Pt | null {
  for (const m of movedPorts) {
    if (Math.abs(p.x - m.x) < EPS && Math.abs(p.y - m.y) < EPS) {
      return { x: m.dx, y: m.dy }
    }
  }
  return null
}

/**
 * Shift only vertices that sit on a moved port; keep the rest of the polyline
 * (including net-label ends). Nudge the neighbouring corner so segments stay
 * orthogonal — same idea as webui applySchematicEdits.
 */
function shiftEdgesOrthogonally(
  edges: Array<{ from: Pt; to: Pt }>,
  movedPorts: Array<{ x: number; y: number; dx: number; dy: number }>,
): Pt[] | null {
  if (!edges.length || movedPorts.length === 0) return null

  type EdgeState = {
    origFrom: Pt
    origTo: Pt
    from: Pt
    to: Pt
    fromShifted: boolean
    toShifted: boolean
  }

  const states: EdgeState[] = edges.map((edge) => {
    const dFrom = getPortDelta(edge.from, movedPorts)
    const dTo = getPortDelta(edge.to, movedPorts)
    return {
      origFrom: edge.from,
      origTo: edge.to,
      from: dFrom
        ? { x: edge.from.x + dFrom.x, y: edge.from.y + dFrom.y }
        : edge.from,
      to: dTo ? { x: edge.to.x + dTo.x, y: edge.to.y + dTo.y } : edge.to,
      fromShifted: !!dFrom,
      toShifted: !!dTo,
    }
  })

  const adjustments = new Map<string, Pt>()
  for (const s of states) {
    const wasH = Math.abs(s.origFrom.y - s.origTo.y) < EPS
    const wasV = Math.abs(s.origFrom.x - s.origTo.x) < EPS
    if (s.fromShifted && !s.toShifted) {
      const key = ptKey(s.origTo)
      if (!adjustments.has(key)) {
        if (wasH) adjustments.set(key, { x: s.to.x, y: s.from.y })
        else if (wasV) adjustments.set(key, { x: s.from.x, y: s.to.y })
      }
    } else if (!s.fromShifted && s.toShifted) {
      const key = ptKey(s.origFrom)
      if (!adjustments.has(key)) {
        if (wasH) adjustments.set(key, { x: s.from.x, y: s.to.y })
        else if (wasV) adjustments.set(key, { x: s.to.x, y: s.from.y })
      }
    }
  }

  const route: Pt[] = []
  let changed = false
  for (let i = 0; i < states.length; i++) {
    const s = states[i]
    const finalFrom = s.fromShifted
      ? s.from
      : (adjustments.get(ptKey(s.origFrom)) ?? s.from)
    const finalTo = s.toShifted
      ? s.to
      : (adjustments.get(ptKey(s.origTo)) ?? s.to)

    if (
      Math.abs(finalFrom.x - s.origFrom.x) > EPS ||
      Math.abs(finalFrom.y - s.origFrom.y) > EPS ||
      Math.abs(finalTo.x - s.origTo.x) > EPS ||
      Math.abs(finalTo.y - s.origTo.y) > EPS
    ) {
      changed = true
    }

    if (i === 0) route.push({ ...finalFrom })
    else {
      const last = route[route.length - 1]
      if (
        Math.abs(last.x - finalFrom.x) > EPS ||
        Math.abs(last.y - finalFrom.y) > EPS
      ) {
        route.push({ ...finalFrom })
      }
    }
    route.push({ ...finalTo })
  }

  return changed && route.length >= 2 ? route : null
}

function applyPathD(traceEl: Element, d: string) {
  const paths = traceEl.querySelectorAll("path")
  for (const path of Array.from(paths)) {
    const cls = path.getAttribute("class") ?? ""
    if (cls.includes("crossing")) continue
    path.setAttribute("d", d)
  }
}

function routeToSvgD(routeMm: Pt[], realToSvgProjection: Matrix): string {
  const routeSvg = routeMm.map((pt) => applyToPoint(realToSvgProjection, pt))
  return routeSvg.map((pt, i) => `${i === 0 ? "M" : "L"} ${pt.x} ${pt.y}`).join(" ")
}

/**
 * Live SVG trace updates while editing:
 * - Manual trace reshape → honour the custom orthogonal route
 * - Component/port move → shift only pin-attached vertices; never rewrite the
 *   whole wire as a port-to-port L (that was destroying net-label connections)
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
      const customRoutes = collectCustomRoutes(editEvents, activeTraceEditEvent)
      const movedPorts = collectMovedPorts(
        circuitJson,
        editEvents,
        activeComponentEditEvent,
        activePortEditEvent,
      )
      if (customRoutes.size === 0 && movedPorts.length === 0) return

      const traces = svg.querySelectorAll(
        '[data-circuit-json-type="schematic_trace"]',
      )

      for (const trace of Array.from(traces)) {
        const traceId = trace.getAttribute("data-schematic-trace-id")
        if (!traceId) continue

        const customRoute = customRoutes.get(traceId)
        if (customRoute && customRoute.length >= 2) {
          // Keep manually reshaped middle segments, but always re-pin ends to
          // moved component pins so the wire never floats off the element.
          let route = customRoute
          if (movedPorts.length > 0) {
            const edges: Array<{ from: Pt; to: Pt }> = []
            for (let i = 0; i < customRoute.length - 1; i++) {
              edges.push({ from: customRoute[i]!, to: customRoute[i + 1]! })
            }
            const shifted = shiftEdgesOrthogonally(edges, movedPorts)
            if (shifted) route = shifted
          }
          applyPathD(trace, routeToSvgD(route, realToSvgProjection))
          continue
        }

        if (movedPorts.length === 0) continue

        const sch_trace = su(circuitJson).schematic_trace.get(traceId) as
          | { edges?: Array<{ from: Pt; to: Pt }> }
          | undefined
        if (!sch_trace?.edges?.length) continue

        const shifted = shiftEdgesOrthogonally(sch_trace.edges, movedPorts)
        if (!shifted) continue
        applyPathD(trace, routeToSvgD(shifted, realToSvgProjection))
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
