import { useCallback, useEffect, useRef, useState } from "react"

interface Props {
  traceId: string
  svgDivRef: React.RefObject<HTMLDivElement | null>
  containerRef: React.RefObject<HTMLDivElement | null>
  circuitJsonKey: string
  interactive: boolean
  onTraceMouseDown?: (traceId: string, event: MouseEvent) => void
}

interface RelativeRect {
  left: number
  top: number
  width: number
  height: number
}

/**
 * Overlays a transparent, hit-testable strip over an existing schematic trace
 * so the user can grab and drag it. The strip follows the trace's visible
 * bounding box (padded a few pixels) and lives above the SVG.
 */
export const SchematicTraceMouseTarget = ({
  traceId,
  svgDivRef,
  containerRef,
  circuitJsonKey,
  interactive,
  onTraceMouseDown,
}: Props) => {
  const [rect, setRect] = useState<RelativeRect | null>(null)
  const frameRef = useRef<number | null>(null)

  const measure = useCallback(() => {
    frameRef.current = null
    const svgDiv = svgDivRef.current
    const container = containerRef.current
    if (!svgDiv || !container) {
      setRect((prev) => (prev ? null : prev))
      return
    }
    const el = svgDiv.querySelector<SVGGraphicsElement>(
      `[data-schematic-trace-id="${traceId}"]`,
    )
    if (!el) {
      setRect((prev) => (prev ? null : prev))
      return
    }
    const bbox = el.getBoundingClientRect()
    const containerRect = container.getBoundingClientRect()
    const pad = 6
    const next: RelativeRect = {
      left: bbox.left - containerRect.left - pad,
      top: bbox.top - containerRect.top - pad,
      width: bbox.width + pad * 2,
      height: bbox.height + pad * 2,
    }
    setRect((prev) =>
      prev &&
      Math.abs(prev.left - next.left) < 0.5 &&
      Math.abs(prev.top - next.top) < 0.5 &&
      Math.abs(prev.width - next.width) < 0.5 &&
      Math.abs(prev.height - next.height) < 0.5
        ? prev
        : next,
    )
  }, [svgDivRef, containerRef, traceId])

  const scheduleMeasure = useCallback(() => {
    if (frameRef.current != null) return
    frameRef.current = requestAnimationFrame(measure)
  }, [measure])

  useEffect(() => {
    scheduleMeasure()
    const svgDiv = svgDivRef.current
    if (!svgDiv) return
    const observer = new MutationObserver(scheduleMeasure)
    observer.observe(svgDiv, {
      childList: true,
      subtree: true,
      attributes: true,
    })
    window.addEventListener("resize", scheduleMeasure)
    return () => {
      observer.disconnect()
      window.removeEventListener("resize", scheduleMeasure)
      if (frameRef.current != null) cancelAnimationFrame(frameRef.current)
    }
  }, [svgDivRef, scheduleMeasure, circuitJsonKey])

  if (!rect || !interactive) return null

  return (
    <div
      style={{
        position: "absolute",
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        cursor: "move",
        pointerEvents: "auto",
        // Debug-friendly: transparent, but shows a faint highlight on hover.
        background: "transparent",
      }}
      onMouseDown={(e) => {
        if (e.button !== 0) return
        e.preventDefault()
        e.stopPropagation()
        onTraceMouseDown?.(traceId, e.nativeEvent)
      }}
    />
  )
}
