import type { HoveredSchematicTrace } from "lib/hooks/useSchematicNetHover"
import { zIndexMap } from "lib/utils/z-index-map"

const POINTER_OFFSET_PX = 12

export const SchematicTraceNetTooltip = ({
  hoveredTrace,
}: {
  hoveredTrace: HoveredSchematicTrace
}) => (
  <div
    data-schematic-trace-net-tooltip
    style={{
      position: "absolute",
      left: hoveredTrace.x + POINTER_OFFSET_PX,
      top: hoveredTrace.y + POINTER_OFFSET_PX,
      zIndex: zIndexMap.schematicTraceNetTooltip,
      pointerEvents: "none",
      backgroundColor: "#f2efcc",
      color: "black",
      padding: "4px 6px",
      borderRadius: "4px",
      fontFamily: "sans-serif",
      fontSize: "11px",
      lineHeight: 1.2,
      whiteSpace: "nowrap",
    }}
  >
    {hoveredTrace.netName}
  </div>
)
