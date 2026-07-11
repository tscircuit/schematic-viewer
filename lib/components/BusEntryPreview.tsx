import { type Matrix, applyToPoint, compose } from "transformation-matrix"
import {
  BUS_ENTRY_STUB_LEN,
  type BusEntryPreviewState,
} from "../hooks/useBusEntryPlacement"

interface Props {
  state: BusEntryPreviewState
  realToSvgProjection: Matrix
  svgToScreenProjection: Matrix
  containerRef: React.RefObject<HTMLDivElement | null>
}

export const BusEntryPreview = ({
  state,
  realToSvgProjection,
  svgToScreenProjection,
  containerRef,
}: Props) => {
  if (!state.anchor || !containerRef.current) return null
  if (!realToSvgProjection?.a || !svgToScreenProjection?.a) return null

  const realToScreen = compose(svgToScreenProjection, realToSvgProjection)
  const toScreen = (pt: { x: number; y: number }) =>
    applyToPoint(realToScreen, pt)

  const p1 = toScreen(state.anchor)
  const p2 = toScreen({
    x: state.anchor.x + BUS_ENTRY_STUB_LEN,
    y: state.anchor.y + BUS_ENTRY_STUB_LEN,
  })

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
        x1={p1.x}
        y1={p1.y}
        x2={p2.x}
        y2={p2.y}
        stroke="#7e3ec0"
        strokeWidth={3}
        strokeDasharray="6 3"
        strokeLinecap="round"
      />
    </svg>
  )
}
