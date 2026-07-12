import { useCallback, useEffect, useRef, useState } from "react"
import { type Matrix, compose } from "transformation-matrix"
import type {
  EditSchematicComponentAddEvent,
  PlacementComponentKind,
} from "../types/edit-events"
import { isMouseCaptureIgnoredTarget } from "../utils/isMouseCaptureIgnoredTarget"

export interface ComponentPlacementState {
  previewPos: { x: number; y: number } | null
  rotation: number
}

export const useComponentPlacement = ({
  enabled,
  componentKind,
  svgToScreenProjection,
  realToSvgProjection,
  containerRef,
  onEditEvent,
}: {
  enabled: boolean
  componentKind: PlacementComponentKind
  svgToScreenProjection: Matrix
  realToSvgProjection: Matrix
  containerRef: React.RefObject<HTMLDivElement | null>
  onEditEvent?: (event: EditSchematicComponentAddEvent) => void
}) => {
  const [state, setState] = useState<ComponentPlacementState>({
    previewPos: null,
    rotation: 0,
  })

  const stateRef = useRef(state)
  stateRef.current = state
  const kindRef = useRef(componentKind)
  kindRef.current = componentKind

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

  const placeAt = useCallback(
    (position: { x: number; y: number }) => {
      const event: EditSchematicComponentAddEvent = {
        edit_event_id: Math.random().toString(36).substr(2, 9),
        edit_event_type: "edit_schematic_component_add",
        position,
        component_kind: kindRef.current,
        rotation: stateRef.current.rotation,
        created_at: Date.now(),
        in_progress: false,
      }
      onEditEvent?.(event)
    },
    [onEditEvent],
  )

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!enabled) return
      setState((prev) => ({
        ...prev,
        previewPos: screenToReal(e.clientX, e.clientY),
      }))
    },
    [enabled, screenToReal],
  )

  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      if (!enabled || e.button !== 0 || isMouseCaptureIgnoredTarget(e.target)) return
      e.preventDefault()
      e.stopPropagation()
      placeAt(screenToReal(e.clientX, e.clientY))
    },
    [enabled, screenToReal, placeAt],
  )

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled) return
    if (e.key === "r" || e.key === "R") {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      e.preventDefault()
      setState((prev) => ({
        ...prev,
        rotation: (prev.rotation + 90) % 360,
      }))
    }
  }, [enabled])

  useEffect(() => {
    if (!enabled) {
      setState({ previewPos: null, rotation: 0 })
      return
    }
    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mousedown", handleMouseDown, { capture: true })
    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mousedown", handleMouseDown, { capture: true })
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [enabled, handleMouseMove, handleMouseDown, handleKeyDown])

  return { componentPlacementState: state }
}
