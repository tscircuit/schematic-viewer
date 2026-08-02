import { su } from "@tscircuit/soup-util"
import { useCallback, useEffect, useRef, useState } from "react"
import { type Matrix, compose } from "transformation-matrix"
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
  onEditEvent?: (event: EditSchematicTraceMoveEvent) => void
  cancelDrag?: () => void
  enabled?: boolean
  snapToGrid?: boolean
}

interface Result {
  handleMouseDown: (traceId: string, e: MouseEvent) => void
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
  // Backend traces often only carry `edges` — use the polyline ends.
  const route = routeFromEdges(trace.edges)
  if (!route || route.length < 2) return null
  return { from: route[0], to: route[route.length - 1] }
}

/**
 * Drags an L-shaped schematic trace by moving the middle corner. Endpoints
 * stay pinned so the wire stays connected. If the trace is currently a
 * straight 2-point route we insert a fresh corner at the mouse on drag start.
 */
export const useSchematicTraceDragging = ({
  circuitJson,
  editEvents,
  svgToScreenProjection,
  realToSvgProjection,
  onEditEvent,
  cancelDrag,
  enabled = false,
  snapToGrid = false,
}: Args): Result => {
  const [activeEvent, setActiveEvent] =
    useState<EditSchematicTraceMoveEventWithElement | null>(null)
  const activeRef = useRef<EditSchematicTraceMoveEventWithElement | null>(null)
  const dragStartRef = useRef<{ x: number; y: number } | null>(null)
  const endpointsRef = useRef<{ from: Pt; to: Pt } | null>(null)
  /** Corner position at drag start — delta is applied relative to this. */
  const initialCornerRef = useRef<Pt | null>(null)

  const realToScreenProjection = compose(
    realToSvgProjection,
    svgToScreenProjection,
  )

  const buildOrthogonalRoute = useCallback(
    (from: Pt, to: Pt, cornerHint: Pt | null): Pt[] => {
      if (Math.abs(from.x - to.x) < 1e-6 || Math.abs(from.y - to.y) < 1e-6) {
        return [from, to]
      }
      const corner = cornerHint ?? { x: to.x, y: from.y }
      return [from, corner, to]
    },
    [],
  )

  const startDrag = useCallback(
    (
      traceId: string,
      clientX: number,
      clientY: number,
      target: EventTarget | null,
    ) => {
      if (!enabled) return false
      const trace = su(circuitJson).schematic_trace.get(traceId) as
        | {
            schematic_trace_id: string
            from_schematic_port_id?: string
            to_schematic_port_id?: string
            edges?: { from: Pt; to: Pt }[]
          }
        | undefined
      if (!trace) return false

      const ends = endpointsFromTrace(circuitJson, trace)
      if (!ends) return false

      if (cancelDrag) cancelDrag()

      const persistedRoute = latestTraceRoute(editEvents, traceId)
      const fromEdges = routeFromEdges(trace.edges)
      const route =
        persistedRoute ??
        fromEdges ??
        buildOrthogonalRoute(ends.from, ends.to, null)

      endpointsRef.current = {
        from: { ...route[0] },
        to: { ...route[route.length - 1] },
      }
      initialCornerRef.current =
        route.length >= 3
          ? { ...route[1] }
          : {
              x: (route[0].x + route[route.length - 1].x) / 2,
              y: (route[0].y + route[route.length - 1].y) / 2,
            }
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
    [buildOrthogonalRoute, cancelDrag, circuitJson, editEvents, enabled],
  )

  const handleMouseDown = useCallback(
    (traceId: string, e: MouseEvent) => {
      startDrag(traceId, e.clientX, e.clientY, e.target)
    },
    [startDrag],
  )

  const updateDrag = useCallback(
    (clientX: number, clientY: number) => {
      if (!activeRef.current || !dragStartRef.current || !endpointsRef.current)
        return
      const screenDelta = {
        x: clientX - dragStartRef.current.x,
        y: clientY - dragStartRef.current.y,
      }
      const mmDelta = {
        x: screenDelta.x / realToScreenProjection.a,
        y: screenDelta.y / realToScreenProjection.d,
      }
      const { from, to } = endpointsRef.current
      const baseCorner = initialCornerRef.current ?? {
        x: (from.x + to.x) / 2,
        y: (from.y + to.y) / 2,
      }

      // Move only the middle corner; endpoints stay pinned.
      let corner = {
        x: baseCorner.x + mmDelta.x,
        y: baseCorner.y + mmDelta.y,
      }
      if (snapToGrid) {
        const snap = (v: number) => Math.round(v * 10) / 10
        corner = { x: snap(corner.x), y: snap(corner.y) }
      }
      const nextRoute = buildOrthogonalRoute(from, to, corner)

      const next = { ...activeRef.current, route: nextRoute }
      activeRef.current = next
      setActiveEvent(next)
    },
    [buildOrthogonalRoute, realToScreenProjection, snapToGrid],
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
    endpointsRef.current = null
    initialCornerRef.current = null
    setActiveEvent(null)
  }, [onEditEvent])

  useEffect(() => {
    const onMove = (e: MouseEvent) => updateDrag(e.clientX, e.clientY)
    const onUp = () => endDrag()
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
    return () => {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
    }
  }, [updateDrag, endDrag])

  return {
    handleMouseDown,
    isDragging: !!activeRef.current,
    activeEditEvent: activeEvent,
  }
}
