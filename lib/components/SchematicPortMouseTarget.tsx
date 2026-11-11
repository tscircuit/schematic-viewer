import { useCallback, useEffect } from "react"
import { useMouseEventsOverBoundingBox } from "../hooks/useMouseEventsOverBoundingBox"
import { useSvgElementMeasurement } from "../hooks/useSvgElementMeasurement"
import { zIndexMap } from "../utils/z-index-map"

interface Props {
  portId: string
  portLabel?: string
  svgDivRef: React.RefObject<HTMLDivElement | null>
  containerRef: React.RefObject<HTMLDivElement | null>
  onPortClick?: (portId: string, event: MouseEvent) => void
  onHoverChange?: (portId: string, isHovering: boolean) => void
  showOutline: boolean
  circuitJsonKey: string
}

export const SchematicPortMouseTarget = ({
  portId,
  portLabel,
  svgDivRef,
  containerRef,
  onPortClick,
  onHoverChange,
  showOutline,
  circuitJsonKey,
}: Props) => {
  const measurement = useSvgElementMeasurement({
    selector: `[data-schematic-port-id="${portId}"]`,
    svgDivRef,
    containerRef,
    circuitJsonKey,
    // Add some padding around the port for easier interaction
    padding: 4,
  })

  const handleClick = useCallback(
    (event: MouseEvent) => {
      if (onPortClick) {
        onPortClick(portId, event)
      }
    },
    [portId, onPortClick],
  )

  const bounds = measurement?.bounds ?? null

  const { hovering } = useMouseEventsOverBoundingBox({
    bounds,
    onClick: onPortClick ? handleClick : undefined,
  })

  // Notify parent of hover state changes
  useEffect(() => {
    if (onHoverChange) {
      onHoverChange(portId, hovering)
    }
  }, [hovering, portId, onHoverChange])

  if (!measurement || !showOutline) {
    return null
  }

  const rect = measurement.rect

  return (
    <>
      <div
        style={{
          position: "absolute",
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
          border: hovering
            ? "1.5px solid rgba(255, 153, 51, 0.9)"
            : "1.5px solid rgba(255, 153, 51, 0.3)",
          backgroundColor: hovering
            ? "rgba(255, 153, 51, 0.15)"
            : "rgba(255, 153, 51, 0.05)",
          borderRadius: "50%",
          pointerEvents: "none",
          zIndex: zIndexMap.schematicPortHoverOutline,
          transition: "border-color 0.15s, background-color 0.15s",
        }}
      />
      {hovering && portLabel && (
        <div
          style={{
            position: "absolute",
            left: rect.left + rect.width / 2,
            top: rect.top - 24,
            transform: "translateX(-50%)",
            backgroundColor: "rgba(0, 0, 0, 0.85)",
            color: "white",
            padding: "4px 8px",
            borderRadius: "4px",
            fontSize: "12px",
            fontFamily: "monospace",
            whiteSpace: "nowrap",
            pointerEvents: "none",
            zIndex: zIndexMap.schematicPortHoverOutline + 1,
          }}
        >
          {portLabel}
        </div>
      )}
    </>
  )
}
