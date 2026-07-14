import { useCallback, useEffect, useRef, useState } from "react"
import {
  type Matrix,
  applyToPoint,
  compose,
  inverse,
} from "transformation-matrix"
import type { EditSchematicHierSheetAddEvent } from "../types/edit-events"
import { isMouseCaptureIgnoredTarget } from "../utils/isMouseCaptureIgnoredTarget"

const MIN_BOX_PX = 48

export interface ScreenBox {
  x: number
  y: number
  width: number
  height: number
}

export interface HierSheetPlacementState {
  isDrawing: boolean
  anchorLocal: { x: number; y: number } | null
  previewLocal: { x: number; y: number } | null
  pendingBox: { x: number; y: number; width: number; height: number } | null
  pendingScreenBox: ScreenBox | null
}

export function normalizeScreenBox(
  a: { x: number; y: number },
  b: { x: number; y: number },
): ScreenBox {
  const x = Math.min(a.x, b.x)
  const y = Math.min(a.y, b.y)
  let width = Math.abs(b.x - a.x)
  let height = Math.abs(b.y - a.y)
  if (width < MIN_BOX_PX) width = MIN_BOX_PX
  if (height < MIN_BOX_PX) height = MIN_BOX_PX
  return { x, y, width, height }
}

export function realBoxFromScreenBox(
  screenBox: ScreenBox,
  localToReal: (x: number, y: number) => { x: number; y: number },
): { x: number; y: number; width: number; height: number } {
  const { x, y, width, height } = screenBox
  const corners = [
    localToReal(x, y),
    localToReal(x + width, y),
    localToReal(x, y + height),
    localToReal(x + width, y + height),
  ]
  const xs = corners.map((c) => c.x)
  const ys = corners.map((c) => c.y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  }
}

export const useHierSheetPlacement = ({
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
  onEditEvent?: (event: EditSchematicHierSheetAddEvent) => void
}) => {
  const [state, setState] = useState<HierSheetPlacementState>({
    isDrawing: false,
    anchorLocal: null,
    previewLocal: null,
    pendingBox: null,
    pendingScreenBox: null,
  })

  const stateRef = useRef(state)
  stateRef.current = state

  const localFromMouse = useCallback(
    (clientX: number, clientY: number) => {
      const container = containerRef.current
      if (!container) return { x: 0, y: 0 }
      const rect = container.getBoundingClientRect()
      return { x: clientX - rect.left, y: clientY - rect.top }
    },
    [containerRef],
  )

  const localToReal = useCallback(
    (localX: number, localY: number) => {
      const realToScreen = compose(svgToScreenProjection, realToSvgProjection)
      return applyToPoint(inverse(realToScreen), { x: localX, y: localY })
    },
    [svgToScreenProjection, realToSvgProjection],
  )

  const reset = useCallback(() => {
    setState({
      isDrawing: false,
      anchorLocal: null,
      previewLocal: null,
      pendingBox: null,
      pendingScreenBox: null,
    })
  }, [])

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!enabled || stateRef.current.pendingBox) return
      const pos = localFromMouse(e.clientX, e.clientY)
      if (stateRef.current.isDrawing && stateRef.current.anchorLocal) {
        setState((prev) => ({ ...prev, previewLocal: pos }))
      }
    },
    [enabled, localFromMouse],
  )

  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      if (
        !enabled ||
        e.button !== 0 ||
        stateRef.current.pendingBox ||
        isMouseCaptureIgnoredTarget(e.target)
      )
        return
      e.preventDefault()
      e.stopPropagation()
      const pos = localFromMouse(e.clientX, e.clientY)
      const current = stateRef.current

      if (!current.isDrawing) {
        setState({
          isDrawing: true,
          anchorLocal: pos,
          previewLocal: pos,
          pendingBox: null,
          pendingScreenBox: null,
        })
        return
      }

      if (!current.anchorLocal) return
      const screenBox = normalizeScreenBox(current.anchorLocal, pos)
      const box = realBoxFromScreenBox(screenBox, localToReal)
      setState({
        isDrawing: false,
        anchorLocal: null,
        previewLocal: null,
        pendingBox: box,
        pendingScreenBox: screenBox,
      })
    },
    [enabled, localFromMouse, localToReal],
  )

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") reset()
    },
    [reset],
  )

  const confirmPlacement = useCallback(
    (sheetName: string, targetSheetId: string) => {
      const box = stateRef.current.pendingBox
      const screenBox = stateRef.current.pendingScreenBox
      if (!box || !screenBox || !sheetName.trim() || !targetSheetId.trim())
        return

      const sheetNamePos = localToReal(screenBox.x + 6, screenBox.y + 14)
      const fileNamePos = localToReal(
        screenBox.x + 6,
        screenBox.y + screenBox.height - 8,
      )

      const event: EditSchematicHierSheetAddEvent = {
        edit_event_id: Math.random().toString(36).substr(2, 9),
        edit_event_type: "edit_schematic_hier_sheet_add",
        box,
        sheet_name: sheetName.trim(),
        target_sheet_id: targetSheetId.trim(),
        sheet_name_pos: sheetNamePos,
        file_name_pos: fileNamePos,
        created_at: Date.now(),
        in_progress: false,
      }
      onEditEvent?.(event)
      reset()
    },
    [onEditEvent, reset, localToReal],
  )

  const cancelPlacement = useCallback(() => reset(), [reset])

  useEffect(() => {
    if (!enabled) {
      reset()
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
  }, [enabled, handleMouseMove, handleMouseDown, handleKeyDown, reset])

  return { hierSheetState: state, confirmPlacement, cancelPlacement }
}
