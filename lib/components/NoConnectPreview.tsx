import { type Matrix, applyToPoint, compose } from "transformation-matrix"
import {
  NO_CONNECT_HALF,
  type NoConnectPreviewState,
} from "../hooks/useNoConnectPlacement"

interface Props {
  state: NoConnectPreviewState
  realToSvgProjection: Matrix
  svgToScreenProjection: Matrix
  containerRef: React.RefObject<HTMLDivElement | null>
}

export const NoConnectPreview = ({
  state,
  realToSvgProjection,
  svgToScreenProjection,
  containerRef,
}: Props) => {
  if (!state.center || !containerRef.current) return null
  if (!realToSvgProjection?.a || !svgToScreenProjection?.a) return null

  const realToScreen = compose(svgToScreenProjection, realToSvgProjection)
  const toScreen = (pt: { x: number; y: number }) =>
    applyToPoint(realToScreen, pt)
  const { x, y } = state.center
  const d = NO_CONNECT_HALF

  const a1 = toScreen({ x: x - d, y: y - d })
  const a2 = toScreen({ x: x + d, y: y + d })
  const b1 = toScreen({ x: x + d, y: y - d })
  const b2 = toScreen({ x: x - d, y: y + d })

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
      <line
        x1={a1.x}
        y1={a1.y}
        x2={a2.x}
        y2={a2.y}
        stroke="#c1271c"
        strokeWidth={2.5}
        strokeDasharray="4 3"
        strokeLinecap="round"
      />
      <line
        x1={b1.x}
        y1={b1.y}
        x2={b2.x}
        y2={b2.y}
        stroke="#c1271c"
        strokeWidth={2.5}
        strokeDasharray="4 3"
        strokeLinecap="round"
      />
    </svg>
  )
}
