import { useCallback, useEffect, useRef, useState } from "react"
import type { BoundingBoxBounds } from "../components/MouseTracker"

interface RelativeRect {
  left: number
  top: number
  width: number
  height: number
}

export interface SvgElementMeasurement {
  /** Viewport coordinates, for hit testing. */
  bounds: BoundingBoxBounds
  /** Relative to the viewer container, for positioning an overlay. */
  rect: RelativeRect
}

const areMeasurementsEqual = (
  a: SvgElementMeasurement | null,
  b: SvgElementMeasurement | null,
) => {
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

/**
 * Track where an element of the rendered schematic SVG is on screen, following
 * pan, zoom, resize and re-renders. Returns null while the element is absent.
 */
export const useSvgElementMeasurement = ({
  selector,
  svgDivRef,
  containerRef,
  circuitJsonKey,
  padding = 0,
}: {
  selector: string
  svgDivRef: React.RefObject<HTMLDivElement | null>
  containerRef: React.RefObject<HTMLDivElement | null>
  circuitJsonKey: string
  padding?: number
}) => {
  const [measurement, setMeasurement] = useState<SvgElementMeasurement | null>(
    null,
  )
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
      selector,
    )
    if (!element) {
      setMeasurement((prev) => (prev ? null : prev))
      return
    }

    const elementRect = element.getBoundingClientRect()
    const containerRect = container.getBoundingClientRect()

    const nextMeasurement: SvgElementMeasurement = {
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
  }, [selector, padding, containerRef, svgDivRef])

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

  return measurement
}
