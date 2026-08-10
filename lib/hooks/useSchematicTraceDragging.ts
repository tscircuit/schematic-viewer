import { su } from "@tscircuit/soup-util"
import { useCallback, useEffect, useRef, useState } from "react"
import { type Matrix, compose, inverse, applyToPoint } from "transformation-matrix"
import type {
  EditSchematicTraceMoveEvent,
  EditSchematicTraceMoveEventWithElement,
  ExtendedManualEditEvent,
} from "../types/edit-events"

interface Args {
  circuitJson: any[]
  editEvents: ExtendedManualEditEvent[]
  svgToScreenProjection: Matrix
  realToSvgProjection: Matrix
  /** Root that contains the schematic SVG (same as svgDivRef). */
  svgDivRef: React.RefObject<HTMLDivElement | null>
  onEditEvent?: (event: EditSchematicTraceMoveEvent) => void
  cancelDrag?: () => void
  enabled?: boolean
  snapToGrid?: boolean
}

interface Result {
  /** Returns true if a trace drag started (caller should skip component/pan). */
  tryHandleMouseDown: (e: React.MouseEvent | MouseEvent) => boolean
  isDragging: boolean
  activeEditEvent: EditSchematicTraceMoveEventWithElement | null
}

type Pt = { x: number; y: number }

function latestTraceRoute(
  events: ExtendedManualEditEvent[],
  traceId: string,
): Pt[] | null {
  for (let i = events.length - 1; i >= 0; i--) {
    const ev = events[i]
    if (
      "edit_event_type" in ev &&
      ev.edit_event_type === "edit_schematic_trace_move" &&
      !ev.in_progress &&
      ev.schematic_trace_id === traceId
    ) {
      return ev.route.map((p) => ({ ...p }))
    }
  }
  return null
}

/**
 * Merges collinear edges into one segment. Backends split a straight wire at
 * junctions and waypoints; without this the user grabs the line and only one
 * piece of it moves, tearing the wire in half.
 */
function simplifyRoute(route: Pt[]): Pt[] {
  if (route.length < 3) return route
  const out: Pt[] = [route[0]]
  for (let i = 1; i < route.length - 1; i++) {
    const prev = out[out.length - 1]
    const cur = route[i]
    const next = route[i + 1]
    const collinearH =
      Math.abs(prev.y - cur.y) < 1e-6 && Math.abs(cur.y - next.y) < 1e-6
    const collinearV =
      Math.abs(prev.x - cur.x) < 1e-6 && Math.abs(cur.x - next.x) < 1e-6
    const duplicate =
      Math.abs(prev.x - cur.x) < 1e-6 && Math.abs(prev.y - cur.y) < 1e-6
    if (collinearH || collinearV || duplicate) continue
    out.push(cur)
  }
  out.push(route[route.length - 1])
  return out
}

function routeFromEdges(
  edges: { from: Pt; to: Pt }[] | undefined,
): Pt[] | null {
  if (!edges || edges.length === 0) return null
  const route: Pt[] = [{ ...edges[0].from }]
  for (const edge of edges) {
    const last = route[route.length - 1]
    if (
      Math.abs(last.x - edge.from.x) > 1e-6 ||
      Math.abs(last.y - edge.from.y) > 1e-6
    ) {
      route.push({ ...edge.from })
    }
    route.push({ ...edge.to })
  }
  return route
}

function endpointsFromTrace(
  circuitJson: any[],
  trace: {
    from_schematic_port_id?: string
    to_schematic_port_id?: string
    edges?: { from: Pt; to: Pt }[]
  },
): { from: Pt; to: Pt } | null {
  if (trace.from_schematic_port_id && trace.to_schematic_port_id) {
    const fromPort = su(circuitJson).schematic_port.get(
      trace.from_schematic_port_id,
    ) as { center: Pt } | undefined
    const toPort = su(circuitJson).schematic_port.get(
      trace.to_schematic_port_id,
    ) as { center: Pt } | undefined
    if (fromPort?.center && toPort?.center) {
      return { from: { ...fromPort.center }, to: { ...toPort.center } }
    }
  }
  const route = routeFromEdges(trace.edges)
  if (!route || route.length < 2) return null
  return { from: route[0], to: route[route.length - 1] }
}

function distPointToSegment(p: Pt, a: Pt, b: Pt): number {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const len2 = dx * dx + dy * dy
  if (len2 < 1e-12) {
    const ex = p.x - a.x
    const ey = p.y - a.y
    return Math.hypot(ex, ey)
  }
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2
  t = Math.max(0, Math.min(1, t))
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy))
}

function nearestSegmentIndex(route: Pt[], point: Pt): number {
  let best = 0
  let bestDist = Infinity
  for (let i = 0; i < route.length - 1; i++) {
    const d = distPointToSegment(point, route[i], route[i + 1])
    if (d < bestDist) {
      bestDist = d
      best = i
    }
  }
  return best
}

/**
 * Drags a schematic trace in select mode by grabbing the SVG wire itself
 * (including the wide invisible hitbox path). Endpoints stay pinned; the
 * grabbed orthogonal segment translates so the wire stays 90°.
 */
export const useSchematicTraceDragging = ({
  circuitJson,
  editEvents,
  svgToScreenProjection,
  realToSvgProjection,
  svgDivRef,
  onEditEvent,
  cancelDrag,
  enabled = false,
  snapToGrid = false,
}: Args): Result => {
  const [activeEvent, setActiveEvent] =
    useState<EditSchematicTraceMoveEventWithElement | null>(null)
  const activeRef = useRef<EditSchematicTraceMoveEventWithElement | null>(null)
  const dragStartRef = useRef<{ x: number; y: number } | null>(null)
  const initialRouteRef = useRef<Pt[] | null>(null)
  const segmentIndexRef = useRef(0)

  const realToScreenProjection = compose(
    realToSvgProjection,
    svgToScreenProjection,
  )

  const startDrag = useCallback(
    (
      traceId: string,
      clientX: number,
      clientY: number,
      target: EventTarget | null,
    ) => {
      if (!enabled) return false
      type TraceEl = {
        schematic_trace_id: string
        from_schematic_port_id?: string
        to_schematic_port_id?: string
        edges?: { from: Pt; to: Pt }[]
      }
      let trace = su(circuitJson).schematic_trace.get(traceId) as
        | TraceEl
        | undefined
      if (!trace) {
        // Fallback: some soup builds only support list().
        trace = (su(circuitJson).schematic_trace.list() as TraceEl[]).find(
          (t) => t.schematic_trace_id === traceId,
        )
      }
      if (!trace) return false

      if (cancelDrag) cancelDrag()

      const ends = endpointsFromTrace(circuitJson, trace)
      const persistedRoute = latestTraceRoute(editEvents, traceId)
      const fromEdges = routeFromEdges(trace.edges)
      let route = persistedRoute ?? fromEdges ?? null
      if (!route || route.length < 2) {
        if (!ends) return false
        route = [ends.from, ends.to].map((p) => ({ ...p }))
      }

      // Prefer live port centers when available so the wire stays attached.
      if (ends) {
        route = [{ ...ends.from }, ...route.slice(1, -1), { ...ends.to }]
      }

      route = simplifyRoute(route)

      // A straight wire keeps its two points here; updateDrag grows it into a
      // staple on first movement, which is the only shape that gives a
      // collinear wire a movable segment on both axes.

      // Map click to real-mm to pick the nearest segment.
      let clickMm: Pt = {
        x: (route[0].x + route[route.length - 1].x) / 2,
        y: (route[0].y + route[route.length - 1].y) / 2,
      }
      try {
        const screenToReal = inverse(realToScreenProjection)
        clickMm = applyToPoint(screenToReal, { x: clientX, y: clientY })
      } catch {
        // keep midpoint fallback
      }

      segmentIndexRef.current = nearestSegmentIndex(route, clickMm)
      initialRouteRef.current = route.map((p) => ({ ...p }))
      dragStartRef.current = { x: clientX, y: clientY }

      const newEvent: EditSchematicTraceMoveEventWithElement = {
        edit_event_id: Math.random().toString(36).slice(2, 11),
        edit_event_type: "edit_schematic_trace_move",
        schematic_trace_id: trace.schematic_trace_id,
        route,
        in_progress: true,
        created_at: Date.now(),
        _element: (target as SVGElement) ?? (null as unknown as SVGElement),
      }
      activeRef.current = newEvent
      setActiveEvent(newEvent)
      return true
    },
    [
      cancelDrag,
      circuitJson,
      editEvents,
      enabled,
      realToScreenProjection,
    ],
  )

  const tryHandleMouseDown = useCallback(
    (e: React.MouseEvent | MouseEvent) => {
      if (!enabled || e.button !== 0) return false
      const target = e.target
      if (!(target instanceof Element)) return false
      const traceEl = target.closest(
        '[data-circuit-json-type="schematic_trace"]',
      )
      if (!traceEl) return false
      // Don't steal clicks that are actually on a component body sitting above.
      if (target.closest('[data-circuit-json-type="schematic_component"]')) {
        return false
      }
      const traceId = traceEl.getAttribute("data-schematic-trace-id")
      if (!traceId) return false
      const started = startDrag(traceId, e.clientX, e.clientY, e.target)
      if (started) {
        e.preventDefault()
        e.stopPropagation()
      }
      return started
    },
    [enabled, startDrag],
  )

  const updateDrag = useCallback(
    (clientX: number, clientY: number) => {
      if (!activeRef.current || !dragStartRef.current || !initialRouteRef.current)
        return

      const screenDelta = {
        x: clientX - dragStartRef.current.x,
        y: clientY - dragStartRef.current.y,
      }
      let mmDelta = {
        x: screenDelta.x / realToScreenProjection.a,
        y: screenDelta.y / realToScreenProjection.d,
      }
      if (snapToGrid) {
        const snap = (v: number) => Math.round(v * 10) / 10
        mmDelta = { x: snap(mmDelta.x), y: snap(mmDelta.y) }
      }

      let initial = initialRouteRef.current
      let seg = segmentIndexRef.current

      // Straight wire: bow it into a staple so the grabbed axis has something
      // to move. The two risers stay orthogonal and remain draggable after drop.
      if (initial.length === 2) {
        const p0 = initial[0]
        const p1 = initial[1]
        const collinearY = Math.abs(p0.y - p1.y) < 1e-6
        const collinearX = Math.abs(p0.x - p1.x) < 1e-6
        if (collinearY) {
          const y = p0.y + mmDelta.y
          initial = [p0, { x: p0.x, y }, { x: p1.x, y }, p1]
          seg = 1
        } else if (collinearX) {
          const x = p0.x + mmDelta.x
          initial = [p0, { x, y: p0.y }, { x, y: p1.y }, p1]
          seg = 1
        } else {
          initial = [p0, { x: p1.x, y: p0.y }, p1]
          seg = 0
        }
        initialRouteRef.current = initial.map((p) => ({ ...p }))
        segmentIndexRef.current = seg
        // The staple already consumed this frame's delta.
        if (collinearY || collinearX) {
          const staple = initial.map((p) => ({ ...p }))
          const event = { ...activeRef.current, route: staple }
          activeRef.current = event
          setActiveEvent(event)
          return
        }
      }

      const a = initial[seg]
      const b = initial[seg + 1]
      if (!a || !b) return

      const horizontal = Math.abs(a.y - b.y) < 1e-6
      const vertical = Math.abs(a.x - b.x) < 1e-6

      let moved0: Pt
      let moved1: Pt
      if (horizontal) {
        const y = a.y + mmDelta.y
        moved0 = { x: a.x, y }
        moved1 = { x: b.x, y }
      } else if (vertical) {
        const x = a.x + mmDelta.x
        moved0 = { x, y: a.y }
        moved1 = { x, y: b.y }
      } else {
        // Legacy diagonal segment — translate it wholesale.
        moved0 = { x: a.x + mmDelta.x, y: a.y + mmDelta.y }
        moved1 = { x: b.x + mmDelta.x, y: b.y + mmDelta.y }
      }

      // A grabbed segment touching a pinned end grows a riser rather than
      // dragging that end, so the wire never goes diagonal.
      const next: Pt[] = []
      for (let i = 0; i < seg; i++) next.push({ ...initial[i] })
      if (seg === 0) next.push({ ...initial[0] })
      next.push(moved0, moved1)
      if (seg + 1 === initial.length - 1) {
        next.push({ ...initial[initial.length - 1] })
      } else {
        for (let i = seg + 2; i < initial.length; i++) next.push({ ...initial[i] })
      }

      const event = { ...activeRef.current, route: next }
      activeRef.current = event
      setActiveEvent(event)
    },
    [realToScreenProjection, snapToGrid],
  )

  const endDrag = useCallback(() => {
    if (!activeRef.current) return
    const final: EditSchematicTraceMoveEvent = {
      ...activeRef.current,
      in_progress: false,
    }
    delete (final as any)._element
    if (onEditEvent) onEditEvent(final)
    activeRef.current = null
    dragStartRef.current = null
    initialRouteRef.current = null
    setActiveEvent(null)
  }, [onEditEvent])

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!activeRef.current) return
      updateDrag(e.clientX, e.clientY)
    }
    const onUp = () => {
      if (!activeRef.current) return
      endDrag()
    }
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
    return () => {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
    }
  }, [updateDrag, endDrag])

  // Also bind directly on the SVG so the wide sch-trace-hitbox path is
  // clickable even when the React container handler order changes.
  useEffect(() => {
    const svgDiv = svgDivRef.current
    if (!enabled || !svgDiv) return
    const onDown = (e: MouseEvent) => {
      tryHandleMouseDown(e)
    }
    svgDiv.addEventListener("mousedown", onDown, true)
    return () => svgDiv.removeEventListener("mousedown", onDown, true)
  }, [enabled, svgDivRef, tryHandleMouseDown])

  return {
    tryHandleMouseDown,
    isDragging: !!activeEvent,
    activeEditEvent: activeEvent,
  }
}
