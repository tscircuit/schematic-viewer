import { useCallback, useEffect, useRef, useState } from "react"
import { type Matrix, compose } from "transformation-matrix"
import type { EditSchematicBusAddEvent } from "../types/edit-events"
import { isMouseCaptureIgnoredTarget } from "../utils/isMouseCaptureIgnoredTarget"

export interface BusDrawingState {
  isDrawing: boolean
  previewEnd: { x: number; y: number } | null
  waypoints: Array<{ x: number; y: number }>
}

export const useBusDrawing = ({
  enabled,
  svgToScreenProjection,
  realToSvgProjection,
  containerRef,
  onEditEvent,
}: {
  enabled: boolean
  svgToScreenProjection: Matrix
  realToSvgProjection: Matrix
  containerRef: React.RefObject<HTMLDivElement | null>
  onEditEvent?: (event: EditSchematicBusAddEvent) => void
}) => {
  const [state, setState] = useState<BusDrawingState>({
    isDrawing: false,
    previewEnd: null,
    waypoints: [],
  })

  const stateRef = useRef(state)
  stateRef.current = state

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

  const dedupeRoute = (route: Array<{ x: number; y: number }>) => {
    const out: Array<{ x: number; y: number }> = []
    for (const p of route) {
      const last = out[out.length - 1]
      if (!last || Math.hypot(p.x - last.x, p.y - last.y) > 0.05) out.push(p)
    }
    return out
  }

  const finishBus = useCallback(
    (route: Array<{ x: number; y: number }>) => {
      const cleaned = dedupeRoute(route)
      if (cleaned.length < 2) return false
      const event: EditSchematicBusAddEvent = {
        edit_event_id: Math.random().toString(36).substr(2, 9),
        edit_event_type: "edit_schematic_bus_add",
        route: cleaned,
        created_at: Date.now(),
        in_progress: false,
      }
      onEditEvent?.(event)
      setState({ isDrawing: false, previewEnd: null, waypoints: [] })
      return true
    },
    [onEditEvent],
  )

  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      if (!enabled || e.button !== 0 || isMouseCaptureIgnoredTarget(e.target)) return
      const current = stateRef.current
      const realPos = screenToReal(e.clientX, e.clientY)

      if (!current.isDrawing) {
        e.stopPropagation()
        setState({
          isDrawing: true,
          previewEnd: realPos,
          waypoints: [realPos],
        })
        return
      }

      e.stopPropagation()
      setState((prev) => ({
        ...prev,
        waypoints: [...prev.waypoints, realPos],
        previewEnd: realPos,
      }))
    },
    [enabled, screenToReal],
  )

  const handleDoubleClick = useCallback(
    (e: MouseEvent) => {
      if (!enabled || !stateRef.current.isDrawing) return
      const current = stateRef.current
      const end = screenToReal(e.clientX, e.clientY)
      const route = [...current.waypoints, end]
      if (finishBus(route.length >= 2 ? route : current.waypoints)) {
        e.preventDefault()
        e.stopPropagation()
      }
    },
    [enabled, screenToReal, finishBus],
  )

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!enabled || !stateRef.current.isDrawing) return
      const realPos = screenToReal(e.clientX, e.clientY)
      setState((prev) => ({ ...prev, previewEnd: realPos }))
    },
    [enabled, screenToReal],
  )

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const target = e.target as Element | null
      if (target?.closest("input, textarea, select")) return

      if (e.key === "Enter" && stateRef.current.isDrawing) {
        const route = stateRef.current.waypoints
        if (finishBus(route)) {
          e.preventDefault()
        }
        return
      }

      if (e.key === "Escape" && stateRef.current.isDrawing) {
        setState({ isDrawing: false, previewEnd: null, waypoints: [] })
      }
    },
    [finishBus],
  )

  useEffect(() => {
    if (!enabled) {
      setState({ isDrawing: false, previewEnd: null, waypoints: [] })
      return
    }
    window.addEventListener("mousedown", handleMouseDown, { capture: true })
    window.addEventListener("dblclick", handleDoubleClick, { capture: true })
    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("mousedown", handleMouseDown, {
        capture: true,
      })
      window.removeEventListener("dblclick", handleDoubleClick, {
        capture: true,
      })
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [
    enabled,
    handleMouseDown,
    handleDoubleClick,
    handleMouseMove,
    handleKeyDown,
  ])

  return { busDrawingState: state }
}
