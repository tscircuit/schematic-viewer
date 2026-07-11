import { useCallback, useEffect, useRef, useState } from "react"
import { type Matrix, compose } from "transformation-matrix"
import type { EditSchematicWireAddEvent } from "../types/edit-events"

export interface WireDrawingState {
  isDrawing: boolean
  fromPortId: string | null
  previewEnd: { x: number; y: number } | null
  waypoints: Array<{ x: number; y: number }>
}

const PORT_HIT_RADIUS_PX = 36

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

  const resolveSchematicPortId = useCallback(
    (portId: string): string | null => {
      const bySchematic = (circuitJson as any[]).find(
        (el) => el.type === "schematic_port" && el.schematic_port_id === portId,
      )
      if (bySchematic) return portId

      const bySource = (circuitJson as any[]).find(
        (el) => el.type === "schematic_port" && el.source_port_id === portId,
      )
      return bySource?.schematic_port_id ?? null
    },
    [circuitJson],
  )

  const getPortCenter = useCallback(
    (portId: string): { x: number; y: number } | null => {
      const schematicPortId = resolveSchematicPortId(portId)
      if (!schematicPortId) return null

      const port = (circuitJson as any[]).find(
        (el) =>
          el.type === "schematic_port" &&
          el.schematic_port_id === schematicPortId,
      )
      if (!port?.center) return null
      return { x: port.center.x, y: port.center.y }
    },
    [circuitJson, resolveSchematicPortId],
  )

  const screenToReal = useCallback(
    (screenX: number, screenY: number) => {
      const container = containerRef.current
      if (!container) return { x: 0, y: 0 }
      const rect = container.getBoundingClientRect()
      const localX = screenX - rect.left
      const localY = screenY - rect.top

      const realToScreen = compose(svgToScreenProjection, realToSvgProjection)

      return {
        x: (localX - realToScreen.e) / realToScreen.a,
        y: (localY - realToScreen.f) / realToScreen.d,
      }
    },
    [svgToScreenProjection, realToSvgProjection, containerRef],
  )

  const getPortAtScreen = useCallback(
    (screenX: number, screenY: number): string | null => {
      const container = containerRef.current
      if (!container) return null

      let closest: { id: string; dist: number } | null = null
      const portEls = container.querySelectorAll("[data-schematic-port-id]")
      for (const node of portEls) {
        const rect = node.getBoundingClientRect()
        const cx = rect.left + rect.width / 2
        const cy = rect.top + rect.height / 2
        const dist = Math.sqrt((cx - screenX) ** 2 + (cy - screenY) ** 2)

        if (dist < PORT_HIT_RADIUS_PX && (!closest || dist < closest.dist)) {
          const id = node.getAttribute("data-schematic-port-id")
          const resolved = id ? resolveSchematicPortId(id) : null
          if (resolved) closest = { id: resolved, dist }
        }
      }

      return closest?.id ?? null
    },
    [containerRef, resolveSchematicPortId],
  )

  const beginWireAtPort = useCallback(
    (portId: string) => {
      const schematicPortId = resolveSchematicPortId(portId)
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
    [getPortCenter, resolveSchematicPortId],
  )

  const finishWireAtPort = useCallback(
    (portId: string) => {
      const current = stateRef.current
      if (!current.isDrawing || !current.fromPortId) return false

      const schematicPortId = resolveSchematicPortId(portId)
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
    [getPortCenter, onEditEvent, resolveSchematicPortId],
  )

  const handlePortMouseDown = useCallback(
    (portId: string, e: MouseEvent) => {
      if (!enabled || e.button !== 0) return

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
      if (!enabled || e.button !== 0) return
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
