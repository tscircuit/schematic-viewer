import { type Matrix, applyToPoint, compose } from "transformation-matrix"
import type { BusDrawingState } from "../hooks/useBusDrawing"

interface Props {
  state: BusDrawingState
  realToSvgProjection: Matrix
  svgToScreenProjection: Matrix
  containerRef: React.RefObject<HTMLDivElement | null>
}

export const BusPreview = ({
  state,
  realToSvgProjection,
  svgToScreenProjection,
  containerRef,
}: Props) => {
  if (!state.isDrawing || !state.previewEnd || state.waypoints.length === 0)
    return null

  const container = containerRef.current
  if (!container) return null

  if (
    !realToSvgProjection?.a ||
    isNaN(realToSvgProjection.a) ||
    !svgToScreenProjection?.a ||
    isNaN(svgToScreenProjection.a)
  )
    return null

  const realToScreen = compose(svgToScreenProjection, realToSvgProjection)
  const toScreen = (pt: { x: number; y: number }) =>
    applyToPoint(realToScreen, pt)

  const points = [...state.waypoints.map(toScreen), toScreen(state.previewEnd)]

  const d = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ")

  return (
    <svg
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 200,
      }}
    >
      <path
        d={d}
        stroke="#7e3ec0"
        strokeWidth={4}
        strokeDasharray="8 4"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
