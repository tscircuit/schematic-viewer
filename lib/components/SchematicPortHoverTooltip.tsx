import React from "react"
import type { HoverLabel } from "../hooks/useSchematicPortHover"
import { zIndexMap } from "../utils/z-index-map"

export const SchematicPortHoverTooltip = ({
  containerRef,
  hoverLabel,
}: {
  containerRef: React.RefObject<HTMLElement>
  hoverLabel: HoverLabel | null
}) => {
  if (!hoverLabel) return null
  const rect = containerRef.current?.getBoundingClientRect()
  if (!rect) return null
  const left = hoverLabel.x - rect.left + 10
  const top = hoverLabel.y - rect.top + 10
  return (
    <div
      style={{
        position: "absolute",
        pointerEvents: "none",
        backgroundColor: "rgba(0,0,0,0.75)",
        color: "white",
        padding: "2px 4px",
        borderRadius: "4px",
        fontFamily: "sans-serif",
        fontSize: "12px",
        left,
        top,
        zIndex: zIndexMap.schematicPortHoverLabel,
      }}
    >
      {hoverLabel.name}
    </div>
  )
}
