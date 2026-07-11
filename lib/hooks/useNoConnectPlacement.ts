import { useCallback, useEffect, useState } from "react"
import { type Matrix, compose } from "transformation-matrix"
import type { EditSchematicNoConnectAddEvent } from "../types/edit-events"

export const NO_CONNECT_HALF = 0.4
const PORT_HIT_RADIUS_PX = 36

export interface NoConnectPreviewState {
  center: { x: number; y: number } | null
}

export const useNoConnectPlacement = ({
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
  onEditEvent?: (event: EditSchematicNoConnectAddEvent) => void
}) => {
  const [previewState, setPreviewState] = useState<NoConnectPreviewState>({
    center: null,
  })

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

  const placeNoConnect = useCallback(
    (center: { x: number; y: number }, schematicPortId?: string) => {
      const event: EditSchematicNoConnectAddEvent = {
        edit_event_id: Math.random().toString(36).substr(2, 9),
        edit_event_type: "edit_schematic_no_connect_add",
        center,
        schematic_port_id: schematicPortId,
        created_at: Date.now(),
        in_progress: false,
      }
      onEditEvent?.(event)
    },
    [onEditEvent],
  )

  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      if (!enabled || e.button !== 0) return
      e.preventDefault()
      e.stopPropagation()

      const portId = getPortAtScreen(e.clientX, e.clientY)
      if (portId) {
        const center = getPortCenter(portId)
        if (center) {
          placeNoConnect(center, portId)
          return
        }
      }
      placeNoConnect(screenToReal(e.clientX, e.clientY))
    },
    [enabled, getPortAtScreen, getPortCenter, placeNoConnect, screenToReal],
  )

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!enabled) return
      const portId = getPortAtScreen(e.clientX, e.clientY)
      if (portId) {
        const center = getPortCenter(portId)
        if (center) {
          setPreviewState({ center })
          return
        }
      }
      setPreviewState({ center: screenToReal(e.clientX, e.clientY) })
    },
    [enabled, getPortAtScreen, getPortCenter, screenToReal],
  )

  useEffect(() => {
    if (!enabled) {
      setPreviewState({ center: null })
      return
    }
    window.addEventListener("mousedown", handleMouseDown, { capture: true })
    window.addEventListener("mousemove", handleMouseMove)
    return () => {
      window.removeEventListener("mousedown", handleMouseDown, {
        capture: true,
      })
      window.removeEventListener("mousemove", handleMouseMove)
    }
  }, [enabled, handleMouseDown, handleMouseMove])

  return { noConnectPreviewState: previewState }
}
