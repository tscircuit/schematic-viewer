import { useCallback, useEffect, useRef, useState } from "react"
import { type Matrix } from "transformation-matrix"
import type { EditSchematicWireAddEvent } from "../types/edit-events"
import { isMouseCaptureIgnoredTarget } from "../utils/isMouseCaptureIgnoredTarget"
import {
  createScreenToReal,
  getSchematicPortAtScreen,
  getSchematicPortCenter,
  resolveSchematicPortId,
} from "../utils/schematicPortHitTest"

export interface WireDrawingState {
  isDrawing: boolean
  fromPortId: string | null
  previewEnd: { x: number; y: number } | null
  waypoints: Array<{ x: number; y: number }>
}

export const useWireDrawing = ({
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
  const [state, setState] = useState<WireDrawingState>({
    isDrawing: false,
    fromPortId: null,
    previewEnd: null,
    waypoints: [],
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

  const beginWireAtPort = useCallback(
    (portId: string) => {
      const schematicPortId = resolveSchematicPortId(circuitJson, portId)
      if (!schematicPortId) return false

      const center = getPortCenter(schematicPortId)
      if (!center) return false

      setState({
        isDrawing: true,
        fromPortId: schematicPortId,
        previewEnd: center,
        waypoints: [center],
      })
      return true
    },
    [circuitJson, getPortCenter],
  )

  const finishWireAtPort = useCallback(
    (portId: string) => {
      const current = stateRef.current
      if (!current.isDrawing || !current.fromPortId) return false

      const schematicPortId = resolveSchematicPortId(circuitJson, portId)
      if (!schematicPortId || schematicPortId === current.fromPortId) {
        return false
      }

      const toCenter = getPortCenter(schematicPortId)
      if (!toCenter) return false

      const event: EditSchematicWireAddEvent = {
        edit_event_id: Math.random().toString(36).substr(2, 9),
        edit_event_type: "edit_schematic_wire_add",
        from_schematic_port_id: current.fromPortId,
        to_schematic_port_id: schematicPortId,
        route: [...current.waypoints, toCenter],
        created_at: Date.now(),
        in_progress: false,
      }
      onEditEvent?.(event)
      setState({
        isDrawing: false,
        fromPortId: null,
        previewEnd: null,
        waypoints: [],
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
        beginWireAtPort(portId)
        return
      }

      if (!finishWireAtPort(portId)) {
        const realPos = screenToReal(e.clientX, e.clientY)
        setState((prev) => ({
          ...prev,
          waypoints: [...prev.waypoints, realPos],
        }))
      }
    },
    [enabled, beginWireAtPort, finishWireAtPort, screenToReal],
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
        beginWireAtPort(portId)
        return
      }

      if (portId && finishWireAtPort(portId)) {
        e.preventDefault()
        e.stopPropagation()
        return
      }

      e.preventDefault()
      e.stopPropagation()
      const realPos = screenToReal(e.clientX, e.clientY)
      setState((prev) => ({
        ...prev,
        waypoints: [...prev.waypoints, realPos],
      }))
    },
    [enabled, getPortAtScreen, beginWireAtPort, finishWireAtPort, screenToReal],
  )

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!enabled || !stateRef.current.isDrawing) return
      const realPos = screenToReal(e.clientX, e.clientY)
      setState((prev) => ({ ...prev, previewEnd: realPos }))
    },
    [enabled, screenToReal],
  )

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape" && stateRef.current.isDrawing) {
      setState({
        isDrawing: false,
        fromPortId: null,
        previewEnd: null,
        waypoints: [],
      })
    }
  }, [])

  useEffect(() => {
    if (!enabled) {
      setState({
        isDrawing: false,
        fromPortId: null,
        previewEnd: null,
        waypoints: [],
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

  return { wireDrawingState: state, handlePortMouseDown }
}
