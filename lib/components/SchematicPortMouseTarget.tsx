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
  portLabel?: string
  svgDivRef: React.RefObject<HTMLDivElement | null>
  containerRef: React.RefObject<HTMLDivElement | null>
  onPortClick?: (portId: string, event: MouseEvent) => void
  onHoverChange?: (portId: string, isHovering: boolean) => void
  showOutline: boolean
  circuitJsonKey: string
}

export const SchematicPortMouseTarget = ({
  portId,
  portLabel,
  svgDivRef,
  containerRef,
  onPortClick,
  onHoverChange,
  showOutline,
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
    const element = svgDiv.querySelector<SVGGraphicsElement | HTMLElement>(
      `[data-schematic-port-id="${portId}"]`,
    )
    if (!element) {
      setMeasurement((prev) => (prev ? null : prev))
      return
    }

    const elementRect = element.getBoundingClientRect()
    const containerRect = container.getBoundingClientRect()

    // Add some padding around the port for easier interaction
    const padding = 4

    const nextMeasurement: Measurement = {
      bounds: {
        minX: elementRect.left - padding,
        maxX: elementRect.right + padding,
        minY: elementRect.top - padding,
        maxY: elementRect.bottom + padding,
      },
      rect: {
        left: elementRect.left - containerRect.left - padding,
        top: elementRect.top - containerRect.top - padding,
        width: elementRect.width + padding * 2,
        height: elementRect.height + padding * 2,
      },
    }

    setMeasurement((prev) =>
      areMeasurementsEqual(prev, nextMeasurement) ? prev : nextMeasurement,
    )
  }, [portId, containerRef, svgDivRef])

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

  // Notify parent of hover state changes
  useEffect(() => {
    if (onHoverChange) {
      onHoverChange(portId, hovering)
    }
  }, [hovering, portId, onHoverChange])

  if (!measurement || !showOutline) {
    return null
  }

  const rect = measurement.rect

  return (
    <>
      <div
        style={{
          position: "absolute",
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
          border: hovering
            ? "1.5px solid rgba(255, 153, 51, 0.9)"
            : "1.5px solid rgba(255, 153, 51, 0.3)",
          backgroundColor: hovering
            ? "rgba(255, 153, 51, 0.15)"
            : "rgba(255, 153, 51, 0.05)",
          borderRadius: "50%",
          pointerEvents: "none",
          zIndex: zIndexMap.schematicPortHoverOutline,
          transition: "border-color 0.15s, background-color 0.15s",
        }}
      />
      {hovering && portLabel && (
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
