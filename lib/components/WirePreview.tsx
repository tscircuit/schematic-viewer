import { type Matrix, applyToPoint, compose } from "transformation-matrix"
import type { WireDrawingState } from "../hooks/useWireDrawing"

interface Props {
  state: WireDrawingState
  realToSvgProjection: Matrix
  svgToScreenProjection: Matrix
  containerRef: React.RefObject<HTMLDivElement | null>
}

export const WirePreview = ({
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
        stroke="#00b4d8"
        strokeWidth={2}
        strokeDasharray="6 3"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={points[0].x}
        cy={points[0].y}
        r={5}
        fill="#00b4d8"
        opacity={0.8}
      />
      <circle
        cx={points[points.length - 1].x}
        cy={points[points.length - 1].y}
        r={4}
        fill="none"
        stroke="#00b4d8"
        strokeWidth={1.5}
        opacity={0.8}
      />
    </svg>
  )
}
