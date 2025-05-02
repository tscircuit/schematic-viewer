import {
  convertCircuitJsonToSchematicSvg,
  type ColorOverrides,
} from "circuit-to-svg"
import { useChangeSchematicComponentLocationsInSvg } from "lib/hooks/useChangeSchematicComponentLocationsInSvg"
import { useChangeSchematicTracesForMovedComponents } from "lib/hooks/useChangeSchematicTracesForMovedComponents"
import { enableDebug } from "lib/utils/debug"
import { useEffect, useMemo, useRef, useState, useCallback } from "react"
import {
  fromString,
  identity,
  toString as transformToString,
  translate,
  scale,
  compose,
  type Matrix,
} from "transformation-matrix"
import { useMouseMatrixTransform } from "use-mouse-matrix-transform"
import { useResizeHandling } from "../hooks/use-resize-handling"
import { useComponentDragging } from "../hooks/useComponentDragging"
import type { ManualEditEvent } from "../types/edit-events"
import { EditIcon } from "./EditIcon"
import type { CircuitJson } from "circuit-json"

interface Props {
  circuitJson: CircuitJson
  containerStyle?: React.CSSProperties
  editEvents?: ManualEditEvent[]
  onEditEvent?: (event: ManualEditEvent) => void
  defaultEditMode?: boolean
  debugGrid?: boolean
  editingEnabled?: boolean
  debug?: boolean
  clickToInteractEnabled?: boolean
  colorOverrides?: ColorOverrides
}

export const SchematicViewer = ({
  circuitJson,
  containerStyle,
  editEvents: unappliedEditEvents = [],
  onEditEvent,
  defaultEditMode = false,
  debugGrid = false,
  editingEnabled = false,
  debug = false,
  clickToInteractEnabled = false,
  colorOverrides,
}: Props) => {
  if (debug) enableDebug()

  // --- State & Refs ---
  const [editModeEnabled, setEditModeEnabled] = useState(defaultEditMode)
  const [isInteractionEnabled, setIsInteractionEnabled] = useState(
    !clickToInteractEnabled,
  )

  const svgDivRef = useRef<HTMLDivElement>(null)
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const pinchState = useRef<{
    initialDistance: number
    focal: { x: number; y: number }
    initialMatrix: Matrix
  } | null>(null)
  const circuitJsonRef = useRef<CircuitJson>(circuitJson)

  // Mouse/pan/zoom hook
  const {
    ref: containerRef,
    cancelDrag,
    transform: svgToScreenProjection,
    setTransform,
  } = useMouseMatrixTransform({
    onSetTransform: (t) => {
      if (svgDivRef.current) {
        svgDivRef.current.style.transform = transformToString(t)
      }
    },
    enabled: isInteractionEnabled,
  })

  // Resize hook to size SVG
  const { containerWidth, containerHeight } = useResizeHandling(
    containerRef as React.RefObject<HTMLElement>,
  )

  // Edit‑mode events buffering
  const [internalEditEvents, setInternalEditEvents] = useState<
    ManualEditEvent[]
  >([])
  const getCircuitHash = (json: CircuitJson) =>
    `${json?.length || 0}_${(json as any)?.editCount || 0}`

  useEffect(() => {
    const newHash = getCircuitHash(circuitJson)
    const oldHash = getCircuitHash(circuitJsonRef.current)
    if (newHash !== oldHash) {
      setInternalEditEvents([])
      circuitJsonRef.current = circuitJson
    }
  }, [circuitJson])

  const allEditEvents = useMemo(
    () => [...unappliedEditEvents, ...internalEditEvents],
    [unappliedEditEvents, internalEditEvents],
  )
  const handleEditEvent = useCallback(
    (e: ManualEditEvent) => {
      setInternalEditEvents((prev) => [...prev, e])
      onEditEvent?.(e)
    },
    [onEditEvent],
  )

  // Generate fresh SVG
  const svgString = useMemo(() => {
    if (!containerWidth || !containerHeight) return ""
    return convertCircuitJsonToSchematicSvg(circuitJson as any, {
      width: containerWidth,
      height: containerHeight,
      grid: debugGrid ? { cellSize: 1, labelCells: true } : undefined,
      colorOverrides,
    })
  }, [circuitJson, containerWidth, containerHeight, debugGrid, colorOverrides])

  // Original real→screen projection from the SVG header
  const realToSvgProjection = useMemo(() => {
    if (!svgString) return identity()
    const match = svgString.match(/data-real-to-screen-transform="([^"]+)"/)
    if (!match) return identity()
    try {
      return fromString(match[1])
    } catch {
      return identity()
    }
  }, [svgString])

  // Component dragging (edit) integration
  const { handleMouseDown, isDragging, activeEditEvent } =
    useComponentDragging({
      onEditEvent: handleEditEvent,
      cancelDrag,
      realToSvgProjection,
      svgToScreenProjection,
      circuitJson,
      editEvents: allEditEvents,
      enabled: editModeEnabled && isInteractionEnabled,
    })

  useChangeSchematicComponentLocationsInSvg({
    svgDivRef,
    editEvents: allEditEvents,
    realToSvgProjection,
    svgToScreenProjection,
    activeEditEvent,
  })
  useChangeSchematicTracesForMovedComponents({
    svgDivRef,
    circuitJson,
    activeEditEvent,
    editEvents: allEditEvents,
  })

  // Utility to simulate mouse events from touch
  const dispatchMouseEvent = useCallback(
    (type: string, touch: Touch) => {
      containerRef.current?.dispatchEvent(
        new MouseEvent(type, {
          bubbles: true,
          clientX: touch.clientX,
          clientY: touch.clientY,
          button: 0,
        }),
      )
    },
    [containerRef],
  )

  // Compute pinch distance & focal point
  const getPinchInfo = (a: Touch, b: Touch) => {
    const dx = b.clientX - a.clientX
    const dy = b.clientY - a.clientY
    const distance = Math.hypot(dx, dy)
    return {
      distance,
      focal: { x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 },
    }
  }

  // Touch handlers
  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (e.touches.length === 2) {
        // begin pinch
        const [t0, t1] = [e.touches[0], e.touches[1]]
        const { distance, focal } = getPinchInfo(t0, t1)
        pinchState.current = {
          initialDistance: distance,
          focal,
          initialMatrix: svgToScreenProjection,
        }
      } else if (e.touches.length === 1) {
        // single-finger drag fallback
        const t = e.touches[0]
        touchStart.current = { x: t.clientX, y: t.clientY }
        dispatchMouseEvent("mousedown", t)
      }
    },
    [dispatchMouseEvent, svgToScreenProjection],
  )

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isInteractionEnabled) return
      e.preventDefault()

      if (e.touches.length === 2 && pinchState.current) {
        const [t0, t1] = [e.touches[0], e.touches[1]]
        const { distance: newDist, focal } = getPinchInfo(t0, t1)
        const { initialDistance, initialMatrix } = pinchState.current
        const s = newDist / initialDistance

        // newMatrix = T(focal) • S(s) • T(-focal) • initialMatrix
        const m = compose(
          translate(focal.x, focal.y),
          scale(s, s),
          translate(-focal.x, -focal.y),
          initialMatrix,
        )

        if (svgDivRef.current) {
          setTransform(m)
        }
      } else if (e.touches.length === 1) {
        const t = e.touches[0]
        dispatchMouseEvent("mousemove", t)
      }
    },
    [dispatchMouseEvent, isInteractionEnabled],
  )

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      // 1) clear pinch state once fewer than two touches remain
      if (e.touches.length < 2) {
        pinchState.current = null
        // cancelDrag()   // ← uncomment if you need to forcibly end any ongoing drag
      }

      // 2) dispatch a mouseup for EACH finger that lifted
      Array.from(e.changedTouches).forEach((t) =>
        dispatchMouseEvent("mouseup", t),
      )

      // 3) click-to-interact logic (single-tap enable)
      if (
        clickToInteractEnabled &&
        !isInteractionEnabled &&
        touchStart.current
      ) {
        const t = e.changedTouches[0]
        const dx = Math.abs(t.clientX - touchStart.current.x)
        const dy = Math.abs(t.clientY - touchStart.current.y)
        if (dx < 10 && dy < 10) {
          setIsInteractionEnabled(true)
        }
      }
    },
    [dispatchMouseEvent, clickToInteractEnabled, isInteractionEnabled /*, cancelDrag */],
  )

  // Attach non-passive touch listeners
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.addEventListener("touchstart", handleTouchStart, { passive: false })
    el.addEventListener("touchmove", handleTouchMove, { passive: false })
    el.addEventListener("touchend", handleTouchEnd)
    return () => {
      el.removeEventListener("touchstart", handleTouchStart)
      el.removeEventListener("touchmove", handleTouchMove)
      el.removeEventListener("touchend", handleTouchEnd)
    }
  }, [containerRef, handleTouchStart, handleTouchMove, handleTouchEnd])

  // Render
  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        backgroundColor: "transparent",
        overflow: "hidden",
        touchAction: "none",
        cursor: isDragging
          ? "grabbing"
          : clickToInteractEnabled && !isInteractionEnabled
          ? "pointer"
          : "grab",
        minHeight: 300,
        ...containerStyle,
      }}
      onPointerDown={(e) => {
        if (clickToInteractEnabled && !isInteractionEnabled) {
          e.preventDefault()
          e.stopPropagation()
          return
        }
        handleMouseDown(e as any)
      }}
    >
      {!isInteractionEnabled && clickToInteractEnabled && (
        <div
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setIsInteractionEnabled(true)
          }}
          style={{
            position: "absolute",
            inset: 0,
            cursor: "pointer",
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "all",
          }}
        >
          <div
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.8)",
              color: "white",
              padding: "12px 24px",
              borderRadius: 8,
              fontSize: 16,
              fontFamily: "sans-serif",
              pointerEvents: "none",
            }}
          >
            Click to Interact
          </div>
        </div>
      )}

      {editingEnabled && (
        <EditIcon
          active={editModeEnabled}
          onClick={() => setEditModeEnabled(!editModeEnabled)}
        />
      )}

      <div
        ref={svgDivRef}
        style={{
          pointerEvents: clickToInteractEnabled
            ? isInteractionEnabled
              ? "auto"
              : "none"
            : "auto",
          transformOrigin: "0 0",
        }}
        dangerouslySetInnerHTML={{ __html: svgString }}
      />
    </div>
  )
}
