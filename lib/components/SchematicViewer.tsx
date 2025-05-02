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

  const [editModeEnabled, setEditModeEnabled] = useState(defaultEditMode)
  const [isInteractionEnabled, setIsInteractionEnabled] = useState(
    !clickToInteractEnabled,
  )
  const svgDivRef = useRef<HTMLDivElement>(null)

  const {
    ref: containerRef,
    cancelDrag,
    transform: svgToScreenProjection,
  } = useMouseMatrixTransform({
    onSetTransform: (t) => {
      if (!svgDivRef.current) return
      svgDivRef.current.style.transform = transformToString(t)
    },
    enabled: isInteractionEnabled,
  })

  const { containerWidth, containerHeight } = useResizeHandling(
    containerRef as React.RefObject<HTMLElement>,
  )

  const [internalEditEvents, setInternalEditEvents] = useState<
    ManualEditEvent[]
  >([])
  const circuitJsonRef = useRef<CircuitJson>(circuitJson)
  const touchStart = useRef<{ x: number; y: number } | null>(null)

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

  const svgString = useMemo(() => {
    if (!containerWidth || !containerHeight) return ""
    return convertCircuitJsonToSchematicSvg(circuitJson as any, {
      width: containerWidth,
      height: containerHeight,
      grid: debugGrid ? { cellSize: 1, labelCells: true } : undefined,
      colorOverrides,
    })
  }, [circuitJson, containerWidth, containerHeight, debugGrid, colorOverrides])

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

  const handleEditEvent = useCallback(
    (e: ManualEditEvent) => {
      setInternalEditEvents((prev) => [...prev, e])
      onEditEvent?.(e)
    },
    [onEditEvent],
  )

  const allEditEvents = useMemo(
    () => [...unappliedEditEvents, ...internalEditEvents],
    [unappliedEditEvents, internalEditEvents],
  )

  const { handleMouseDown, isDragging, activeEditEvent } = useComponentDragging(
    {
      onEditEvent: handleEditEvent,
      cancelDrag,
      realToSvgProjection,
      svgToScreenProjection,
      circuitJson,
      editEvents: allEditEvents,
      enabled: editModeEnabled && isInteractionEnabled,
    },
  )

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

  // Dispatch simulated mouse events for touch
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

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      const t = e.touches[0]
      touchStart.current = { x: t.clientX, y: t.clientY }
      dispatchMouseEvent("mousedown", t)
    },
    [dispatchMouseEvent],
  )
  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isInteractionEnabled) return
      e.preventDefault()
      const t = e.touches[0]
      dispatchMouseEvent("mousemove", t)
    },
    [dispatchMouseEvent, isInteractionEnabled],
  )
  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      const t = e.changedTouches[0]
      dispatchMouseEvent("mouseup", t)
      if (
        clickToInteractEnabled &&
        !isInteractionEnabled &&
        touchStart.current
      ) {
        const dx = Math.abs(t.clientX - touchStart.current.x)
        const dy = Math.abs(t.clientY - touchStart.current.y)
        if (dx < 10 && dy < 10) {
          setIsInteractionEnabled(true)
        }
      }
    },
    [dispatchMouseEvent, clickToInteractEnabled, isInteractionEnabled],
  )

  // Attach non-passive native listeners for touch events
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

  const svgDiv = (
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
  )

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
      {svgDiv}
    </div>
  )
}
