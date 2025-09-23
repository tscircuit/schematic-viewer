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
  componentId: string
  svgDivRef: React.RefObject<HTMLDivElement | null>
  containerRef: React.RefObject<HTMLDivElement | null>
  onComponentClick?: (componentId: string, event: MouseEvent) => void
  showOutline: boolean
  circuitJsonKey: string
}

export const SchematicComponentMouseTarget = ({
  componentId,
  svgDivRef,
  containerRef,
  onComponentClick,
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
      `[data-schematic-component-id="${componentId}"]`,
    )
    if (!element) {
      setMeasurement((prev) => (prev ? null : prev))
      return
    }

    const elementRect = element.getBoundingClientRect()
    const containerRect = container.getBoundingClientRect()

    const nextMeasurement: Measurement = {
      bounds: {
        minX: elementRect.left,
        maxX: elementRect.right,
        minY: elementRect.top,
        maxY: elementRect.bottom,
      },
      rect: {
        left: elementRect.left - containerRect.left,
        top: elementRect.top - containerRect.top,
        width: elementRect.width,
        height: elementRect.height,
      },
    }

    setMeasurement((prev) =>
      areMeasurementsEqual(prev, nextMeasurement) ? prev : nextMeasurement,
    )
  }, [componentId, containerRef, svgDivRef])

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
      if (onComponentClick) {
        onComponentClick(componentId, event)
      }
    },
    [componentId, onComponentClick],
  )

  const bounds = measurement?.bounds ?? null

  const { hovering } = useMouseEventsOverBoundingBox({
    bounds,
    onClick: onComponentClick ? handleClick : undefined,
  })

  if (!measurement || !hovering || !showOutline) {
    return null
  }

  const rect = measurement.rect

  return (
    <div
      style={{
        position: "absolute",
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        borderRadius: "6px",
        pointerEvents: "none",
        zIndex: zIndexMap.schematicComponentHoverOutline,
      }}
    />
  )
}
