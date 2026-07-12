import type { Matrix } from "transformation-matrix"
import type { ComponentPlacementState } from "../hooks/useComponentPlacement"

const KIND_LABEL: Record<string, string> = {
  resistor: "R",
  capacitor: "C",
  inductor: "L",
}

export function ComponentPlacementPreview({
  state,
  realToSvgProjection,
  svgToScreenProjection,
  containerRef,
  componentKind,
}: {
  state: ComponentPlacementState
  realToSvgProjection: Matrix
  svgToScreenProjection: Matrix
  containerRef: React.RefObject<HTMLDivElement | null>
  componentKind: string
}) {
  if (!state.previewPos) return null

  const container = containerRef.current
  if (!container) return null

  const realToScreen = {
    a: realToSvgProjection.a * svgToScreenProjection.a,
    d: realToSvgProjection.d * svgToScreenProjection.d,
    e:
      realToSvgProjection.e * svgToScreenProjection.a + svgToScreenProjection.e,
    f:
      realToSvgProjection.f * svgToScreenProjection.d + svgToScreenProjection.f,
  }

  const sx = state.previewPos.x * realToScreen.a + realToScreen.e
  const sy = state.previewPos.y * realToScreen.d + realToScreen.f
  const label = KIND_LABEL[componentKind] ?? "?"

  return (
    <div
      className="pointer-events-none absolute z-20"
      style={{
        left: sx,
        top: sy,
        transform: `translate(-50%, -50%) rotate(${state.rotation}deg)`,
      }}
    >
      <div
        className="rounded border border-dashed px-2 py-1 font-mono text-[11px]"
        style={{
          borderColor: "#1f6feb",
          color: "#1f6feb",
          background: "rgba(31, 111, 235, 0.08)",
        }}
      >
        {label}
      </div>
    </div>
  )
}
