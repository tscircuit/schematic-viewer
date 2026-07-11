import { useCallback, useEffect, useState } from "react"
import { type Matrix, compose } from "transformation-matrix"
import type { EditSchematicBusEntryAddEvent } from "../types/edit-events"

export const BUS_ENTRY_STUB_LEN = 2.5

export interface BusEntryPreviewState {
  anchor: { x: number; y: number } | null
}

export const useBusEntryPlacement = ({
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
  onEditEvent?: (event: EditSchematicBusEntryAddEvent) => void
}) => {
  const [previewState, setPreviewState] = useState<BusEntryPreviewState>({
    anchor: null,
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

  const placeEntry = useCallback(
    (anchor: { x: number; y: number }) => {
      const event: EditSchematicBusEntryAddEvent = {
        edit_event_id: Math.random().toString(36).substr(2, 9),
        edit_event_type: "edit_schematic_bus_entry_add",
        anchor,
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
      const anchor = screenToReal(e.clientX, e.clientY)
      e.preventDefault()
      e.stopPropagation()
      placeEntry(anchor)
    },
    [enabled, screenToReal, placeEntry],
  )

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!enabled) return
      setPreviewState({ anchor: screenToReal(e.clientX, e.clientY) })
    },
    [enabled, screenToReal],
  )

  useEffect(() => {
    if (!enabled) {
      setPreviewState({ anchor: null })
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

  return { busEntryPreviewState: previewState }
}
