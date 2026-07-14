import { useCallback, useEffect, useRef, useState } from "react"
import { type Matrix, compose } from "transformation-matrix"
import type { EditSchematicGlobalLabelAddEvent } from "../types/edit-events"
import { isMouseCaptureIgnoredTarget } from "../utils/isMouseCaptureIgnoredTarget"

const PORT_SNAP_RADIUS_PX = 32

export interface GlobalLabelPlacementState {
  previewPos: { x: number; y: number } | null
  pendingPos: { x: number; y: number } | null
  pendingPortId: string | null
}

export const useGlobalLabelPlacement = ({
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
  onEditEvent?: (event: EditSchematicGlobalLabelAddEvent) => void
}) => {
  const [state, setState] = useState<GlobalLabelPlacementState>({
    previewPos: null,
    pendingPos: null,
    pendingPortId: null,
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

  const snapToPort = useCallback(
    (
      screenX: number,
      screenY: number,
    ): { pos: { x: number; y: number }; portId: string | null } => {
      const container = containerRef.current
      if (!container)
        return { pos: screenToReal(screenX, screenY), portId: null }

      let closest: {
        id: string
        dist: number
        center: { x: number; y: number }
      } | null = null
      const portEls = container.querySelectorAll("[data-schematic-port-id]")

      for (const node of Array.from(portEls)) {
        const rect = node.getBoundingClientRect()
        const cx = rect.left + rect.width / 2
        const cy = rect.top + rect.height / 2
        const dist = Math.sqrt((cx - screenX) ** 2 + (cy - screenY) ** 2)
        if (dist < PORT_SNAP_RADIUS_PX && (!closest || dist < closest.dist)) {
          const id = node.getAttribute("data-schematic-port-id")
          const portEl = circuitJson.find(
            (el) => el.type === "schematic_port" && el.schematic_port_id === id,
          )
          if (id && portEl?.center) {
            closest = { id, dist, center: portEl.center }
          }
        }
      }

      if (closest) return { pos: closest.center, portId: closest.id }
      return { pos: screenToReal(screenX, screenY), portId: null }
    },
    [containerRef, circuitJson, screenToReal],
  )

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!enabled || stateRef.current.pendingPos) return
      const { pos } = snapToPort(e.clientX, e.clientY)
      setState((prev) => ({ ...prev, previewPos: pos }))
    },
    [enabled, snapToPort],
  )

  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      if (!enabled || e.button !== 0 || isMouseCaptureIgnoredTarget(e.target))
        return
      if (stateRef.current.pendingPos) return
      e.preventDefault()
      e.stopPropagation()
      const { pos, portId } = snapToPort(e.clientX, e.clientY)
      setState((prev) => ({
        ...prev,
        pendingPos: pos,
        pendingPortId: portId,
        previewPos: null,
      }))
    },
    [enabled, snapToPort],
  )

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") {
      setState({
        previewPos: null,
        pendingPos: null,
        pendingPortId: null,
      })
    }
  }, [])

  const confirmPlacement = useCallback(
    (netName: string) => {
      const current = stateRef.current
      if (!current.pendingPos || !netName.trim()) return
      const event: EditSchematicGlobalLabelAddEvent = {
        edit_event_id: Math.random().toString(36).substr(2, 9),
        edit_event_type: "edit_schematic_global_label_add",
        position: current.pendingPos,
        net_name: netName.trim(),
        schematic_port_id: current.pendingPortId ?? undefined,
        anchor_side: "right",
        created_at: Date.now(),
        in_progress: false,
      }
      onEditEvent?.(event)
      setState({ previewPos: null, pendingPos: null, pendingPortId: null })
    },
    [onEditEvent],
  )

  const cancelPlacement = useCallback(() => {
    setState({ previewPos: null, pendingPos: null, pendingPortId: null })
  }, [])

  useEffect(() => {
    if (!enabled) {
      setState({ previewPos: null, pendingPos: null, pendingPortId: null })
      return
    }
    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mousedown", handleMouseDown, { capture: true })
    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mousedown", handleMouseDown, {
        capture: true,
      })
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [enabled, handleMouseMove, handleMouseDown, handleKeyDown])

  return { globalLabelState: state, confirmPlacement, cancelPlacement }
}
