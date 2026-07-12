import { useCallback, useEffect, useRef, useState } from "react"
import { type Matrix, compose } from "transformation-matrix"
import type { EditSchematicTextNoteAddEvent } from "../types/edit-events"
import { isMouseCaptureIgnoredTarget } from "../utils/isMouseCaptureIgnoredTarget"

export interface TextNotePlacementState {
  previewPos: { x: number; y: number } | null
  pendingPos: { x: number; y: number } | null
}

export const useTextNotePlacement = ({
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
  onEditEvent?: (event: EditSchematicTextNoteAddEvent) => void
}) => {
  const [state, setState] = useState<TextNotePlacementState>({
    previewPos: null,
    pendingPos: null,
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

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!enabled || stateRef.current.pendingPos) return
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
      if (stateRef.current.pendingPos) return
      e.preventDefault()
      e.stopPropagation()
      setState((prev) => ({
        ...prev,
        pendingPos: screenToReal(e.clientX, e.clientY),
        previewPos: null,
      }))
    },
    [enabled, screenToReal],
  )

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") {
      setState({ previewPos: null, pendingPos: null })
    }
  }, [])

  const confirmPlacement = useCallback(
    (text: string) => {
      const current = stateRef.current
      if (!current.pendingPos || !text.trim()) return
      const event: EditSchematicTextNoteAddEvent = {
        edit_event_id: Math.random().toString(36).substr(2, 9),
        edit_event_type: "edit_schematic_text_note_add",
        position: current.pendingPos,
        text: text.trim(),
        anchor: "left",
        font_size: 0.2,
        color: "#1a1612",
        created_at: Date.now(),
        in_progress: false,
      }
      onEditEvent?.(event)
      setState({ previewPos: null, pendingPos: null })
    },
    [onEditEvent],
  )

  const cancelPlacement = useCallback(() => {
    setState({ previewPos: null, pendingPos: null })
  }, [])

  useEffect(() => {
    if (!enabled) {
      setState({ previewPos: null, pendingPos: null })
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

  return { textNoteState: state, confirmPlacement, cancelPlacement }
}
