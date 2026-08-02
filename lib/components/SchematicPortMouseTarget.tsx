import { useCallback, useEffect, useRef, useState } from "react"
import { useMouseEventsOverBoundingBox } from "../hooks/useMouseEventsOverBoundingBox"
import type { BoundingBoxBounds } from "./MouseTracker"
import { zIndexMap } from "../utils/z-index-map"

interface RelativeRect {
  left: number
  top: number
  width: number
  height: number
}

interface Measurement {
  bounds: BoundingBoxBounds
  rect: RelativeRect
}

const areMeasurementsEqual = (a: Measurement | null, b: Measurement | null) => {
  if (!a && !b) return true
  if (!a || !b) return false
  return (
    Math.abs(a.bounds.minX - b.bounds.minX) < 0.5 &&
    Math.abs(a.bounds.maxX - b.bounds.maxX) < 0.5 &&
    Math.abs(a.bounds.minY - b.bounds.minY) < 0.5 &&
    Math.abs(a.bounds.maxY - b.bounds.maxY) < 0.5 &&
    Math.abs(a.rect.left - b.rect.left) < 0.5 &&
    Math.abs(a.rect.top - b.rect.top) < 0.5 &&
    Math.abs(a.rect.width - b.rect.width) < 0.5 &&
    Math.abs(a.rect.height - b.rect.height) < 0.5
  )
}

interface Props {
  portId: string
  /** circuit-to-svg pin groups use source_port_id on data-schematic-port-id. */
  sourcePortId?: string
  portLabel?: string
  svgDivRef: React.RefObject<HTMLDivElement | null>
  containerRef: React.RefObject<HTMLDivElement | null>
  onPortClick?: (portId: string, event: MouseEvent) => void
  onPortMouseDown?: (portId: string, event: MouseEvent) => void
  onHoverChange?: (portId: string, isHovering: boolean) => void
  showOutline: boolean
  interactive?: boolean
  hitPaddingPx?: number
  circuitJsonKey: string
}

export const SchematicPortMouseTarget = ({
  portId,
  sourcePortId,
  portLabel,
  svgDivRef,
  containerRef,
  onPortClick,
  onPortMouseDown,
  onHoverChange,
  showOutline,
  interactive = false,
  hitPaddingPx = 4,
  circuitJsonKey,
}: Props) => {
  const [measurement, setMeasurement] = useState<Measurement | null>(null)
  const frameRef = useRef<number | null>(null)

  const measure = useCallback(() => {
    frameRef.current = null
    const svgDiv = svgDivRef.current
    const container = containerRef.current
    if (!svgDiv || !container) {
      setMeasurement((prev) => (prev ? null : prev))
      return
    }
    // Prefer the pin group stamped with source_port_id (always present on
    // box components); fall back to schematic_port_id (drawPorts indicators).
    const element =
      (sourcePortId
        ? svgDiv.querySelector<SVGGraphicsElement | HTMLElement>(
            `[data-schematic-port-id="${sourcePortId}"]`,
          )
        : null) ??
      svgDiv.querySelector<SVGGraphicsElement | HTMLElement>(
        `[data-schematic-port-id="${portId}"]`,
      )
    if (!element) {
      setMeasurement((prev) => (prev ? null : prev))
      return
    }

    const elementRect = element.getBoundingClientRect()
    const containerRect = container.getBoundingClientRect()
    const pad = hitPaddingPx

    const nextMeasurement: Measurement = {
      bounds: {
        minX: elementRect.left - pad,
        maxX: elementRect.right + pad,
        minY: elementRect.top - pad,
        maxY: elementRect.bottom + pad,
      },
      rect: {
        left: elementRect.left - containerRect.left - pad,
        top: elementRect.top - containerRect.top - pad,
        width: elementRect.width + pad * 2,
        height: elementRect.height + pad * 2,
      },
    }

    setMeasurement((prev) =>
      areMeasurementsEqual(prev, nextMeasurement) ? prev : nextMeasurement,
    )
  }, [portId, sourcePortId, containerRef, svgDivRef, hitPaddingPx])

  const scheduleMeasure = useCallback(() => {
    if (frameRef.current !== null) return
    frameRef.current = window.requestAnimationFrame(measure)
  }, [measure])

  useEffect(() => {
    scheduleMeasure()
  }, [scheduleMeasure, circuitJsonKey])

  useEffect(() => {
    scheduleMeasure()
    const svgDiv = svgDivRef.current
    const container = containerRef.current
    if (!svgDiv || !container) return

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => {
            scheduleMeasure()
          })
        : null
    resizeObserver?.observe(container)
    resizeObserver?.observe(svgDiv)

    const mutationObserver =
      typeof MutationObserver !== "undefined"
        ? new MutationObserver(() => {
            scheduleMeasure()
          })
        : null
    mutationObserver?.observe(svgDiv, {
      attributes: true,
      attributeFilter: ["style", "transform"],
      subtree: true,
      childList: true,
    })

    window.addEventListener("scroll", scheduleMeasure, true)
    window.addEventListener("resize", scheduleMeasure)

    return () => {
      resizeObserver?.disconnect()
      mutationObserver?.disconnect()
      window.removeEventListener("scroll", scheduleMeasure, true)
      window.removeEventListener("resize", scheduleMeasure)
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current)
        frameRef.current = null
      }
    }
  }, [scheduleMeasure, svgDivRef, containerRef])

  const handleClick = useCallback(
    (event: MouseEvent) => {
      if (onPortClick) {
        onPortClick(portId, event)
      }
    },
    [portId, onPortClick],
  )

  const bounds = measurement?.bounds ?? null

  const { hovering } = useMouseEventsOverBoundingBox({
    bounds,
    onClick: onPortClick ? handleClick : undefined,
  })

  useEffect(() => {
    if (onHoverChange) {
      onHoverChange(portId, hovering)
    }
  }, [hovering, portId, onHoverChange])

  // Need either a visible outline (draw tools) or an invisible hit target
  // (select-mode port drag) — otherwise return nothing.
  if (!measurement || (!showOutline && !interactive)) {
    return null
  }

  const rect = measurement.rect

  return (
    <>
      <div
        onMouseDown={
          interactive && onPortMouseDown
            ? (e) => {
                e.preventDefault()
                e.stopPropagation()
                onPortMouseDown(portId, e.nativeEvent)
              }
            : undefined
        }
        style={{
          position: "absolute",
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
          border: showOutline
            ? hovering
              ? "1.5px solid rgba(255, 153, 51, 0.9)"
              : "1.5px solid rgba(255, 153, 51, 0.3)"
            : "none",
          backgroundColor: showOutline
            ? hovering
              ? "rgba(255, 153, 51, 0.15)"
              : "rgba(255, 153, 51, 0.05)"
            : "transparent",
          borderRadius: "50%",
          pointerEvents: interactive ? "auto" : "none",
          cursor: interactive ? (showOutline ? "crosshair" : "move") : undefined,
          zIndex: zIndexMap.schematicPortHoverOutline,
          transition: showOutline
            ? "border-color 0.15s, background-color 0.15s"
            : undefined,
        }}
      />
      {showOutline && hovering && portLabel && (
        <div
          style={{
            position: "absolute",
            left: rect.left + rect.width / 2,
            top: rect.top - 24,
            transform: "translateX(-50%)",
            backgroundColor: "rgba(0, 0, 0, 0.85)",
            color: "white",
            padding: "4px 8px",
            borderRadius: "4px",
            fontSize: "12px",
            fontFamily: "monospace",
            whiteSpace: "nowrap",
            pointerEvents: "none",
            zIndex: zIndexMap.schematicPortHoverOutline + 1,
          }}
        >
          {portLabel}
        </div>
      )}
    </>
  )
}
