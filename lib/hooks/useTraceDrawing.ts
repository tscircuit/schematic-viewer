import { useCallback, useEffect, useRef, useState } from "react"
import { type Matrix } from "transformation-matrix"
import type { EditSchematicWireAddEvent } from "../types/edit-events"
import { computeTraceRoute } from "../utils/computeTraceRoute"
import { isMouseCaptureIgnoredTarget } from "../utils/isMouseCaptureIgnoredTarget"
import {
  createScreenToReal,
  getSchematicPortAtScreen,
  getSchematicPortCenter,
  resolveSchematicPortId,
} from "../utils/schematicPortHitTest"

export interface TraceDrawingState {
  isDrawing: boolean
  fromPortId: string | null
  previewEnd: { x: number; y: number } | null
  previewRoute: Array<{ x: number; y: number }>
}

export const useTraceDrawing = ({
  enabled,
  circuitJson,
  svgToScreenProjection,
  realToSvgProjection,
  containerRef,
  onEditEvent,
}: {
  enabled: boolean
  circuitJson: any[]
  svgToScreenProjection: Matrix
  realToSvgProjection: Matrix
  containerRef: React.RefObject<HTMLDivElement | null>
  onEditEvent?: (event: EditSchematicWireAddEvent) => void
}) => {
  const [state, setState] = useState<TraceDrawingState>({
    isDrawing: false,
    fromPortId: null,
    previewEnd: null,
    previewRoute: [],
  })

  const stateRef = useRef(state)
  stateRef.current = state

  const screenToReal = useCallback(
    createScreenToReal(
      svgToScreenProjection,
      realToSvgProjection,
      containerRef,
    ),
    [svgToScreenProjection, realToSvgProjection, containerRef],
  )

  const getPortCenter = useCallback(
    (portId: string) => {
      const schematicPortId = resolveSchematicPortId(circuitJson, portId)
      if (!schematicPortId) return null
      return getSchematicPortCenter(
        circuitJson,
        containerRef.current,
        schematicPortId,
        screenToReal,
      )
    },
    [circuitJson, containerRef, screenToReal],
  )

  const getPortAtScreen = useCallback(
    (screenX: number, screenY: number) =>
      getSchematicPortAtScreen(
        containerRef.current,
        circuitJson,
        screenX,
        screenY,
      ),
    [circuitJson, containerRef],
  )

  const beginTraceAtPort = useCallback(
    (portId: string) => {
      const schematicPortId = resolveSchematicPortId(circuitJson, portId)
      if (!schematicPortId) return false

      const center = getPortCenter(schematicPortId)
      if (!center) return false

      setState({
        isDrawing: true,
        fromPortId: schematicPortId,
        previewEnd: center,
        previewRoute: [center],
      })
      return true
    },
    [circuitJson, getPortCenter],
  )

  const finishTraceAtPort = useCallback(
    (portId: string) => {
      const current = stateRef.current
      if (!current.isDrawing || !current.fromPortId) return false

      const schematicPortId = resolveSchematicPortId(circuitJson, portId)
      if (!schematicPortId || schematicPortId === current.fromPortId) {
        return false
      }

      const fromCenter = getPortCenter(current.fromPortId)
      const toCenter = getPortCenter(schematicPortId)
      if (!fromCenter || !toCenter) return false

      const route = computeTraceRoute(fromCenter, toCenter)
      const event: EditSchematicWireAddEvent = {
        edit_event_id: Math.random().toString(36).substr(2, 9),
        edit_event_type: "edit_schematic_wire_add",
        from_schematic_port_id: current.fromPortId,
        to_schematic_port_id: schematicPortId,
        route,
        created_at: Date.now(),
        in_progress: false,
      }
      onEditEvent?.(event)
      setState({
        isDrawing: false,
        fromPortId: null,
        previewEnd: null,
        previewRoute: [],
      })
      return true
    },
    [circuitJson, getPortCenter, onEditEvent],
  )

  const handlePortMouseDown = useCallback(
    (portId: string, e: MouseEvent) => {
      if (!enabled || e.button !== 0 || isMouseCaptureIgnoredTarget(e.target)) {
        return
      }

      e.preventDefault()
      e.stopPropagation()

      const current = stateRef.current
      if (!current.isDrawing) {
        beginTraceAtPort(portId)
        return
      }

      finishTraceAtPort(portId)
    },
    [enabled, beginTraceAtPort, finishTraceAtPort],
  )

  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      if (!enabled || e.button !== 0 || isMouseCaptureIgnoredTarget(e.target)) {
        return
      }

      const current = stateRef.current
      const portId = getPortAtScreen(e.clientX, e.clientY)

      if (!current.isDrawing) {
        if (!portId) return
        e.preventDefault()
        e.stopPropagation()
        beginTraceAtPort(portId)
        return
      }

      if (portId && finishTraceAtPort(portId)) {
        e.preventDefault()
        e.stopPropagation()
      }
    },
    [enabled, getPortAtScreen, beginTraceAtPort, finishTraceAtPort],
  )

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (
        !enabled ||
        !stateRef.current.isDrawing ||
        !stateRef.current.fromPortId
      ) {
        return
      }
      const fromCenter = getPortCenter(stateRef.current.fromPortId)
      if (!fromCenter) return
      const hover = screenToReal(e.clientX, e.clientY)
      setState((prev) => ({
        ...prev,
        previewEnd: hover,
        previewRoute: computeTraceRoute(fromCenter, hover),
      }))
    },
    [enabled, getPortCenter, screenToReal],
  )

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape" && stateRef.current.isDrawing) {
      setState({
        isDrawing: false,
        fromPortId: null,
        previewEnd: null,
        previewRoute: [],
      })
    }
  }, [])

  useEffect(() => {
    if (!enabled) {
      setState({
        isDrawing: false,
        fromPortId: null,
        previewEnd: null,
        previewRoute: [],
      })
      return
    }
    window.addEventListener("mousedown", handleMouseDown, { capture: true })
    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("mousedown", handleMouseDown, {
        capture: true,
      })
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [enabled, handleMouseDown, handleMouseMove, handleKeyDown])

  const wireDrawingState = {
    isDrawing: state.isDrawing,
    fromPortId: state.fromPortId,
    previewEnd: state.previewEnd,
    waypoints: state.previewRoute,
  }

  return { traceDrawingState: state, wireDrawingState, handlePortMouseDown }
}
