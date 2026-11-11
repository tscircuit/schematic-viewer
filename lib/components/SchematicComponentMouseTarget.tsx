import { useCallback, useEffect } from "react"
import { useMouseEventsOverBoundingBox } from "../hooks/useMouseEventsOverBoundingBox"
import { useSvgElementMeasurement } from "../hooks/useSvgElementMeasurement"
import { zIndexMap } from "../utils/z-index-map"

interface Props {
  componentId: string
  svgDivRef: React.RefObject<HTMLDivElement | null>
  containerRef: React.RefObject<HTMLDivElement | null>
  onComponentClick?: (componentId: string, event: MouseEvent) => void
  onHoverChange?: (componentId: string, isHovering: boolean) => void
  showOutline: boolean
  circuitJsonKey: string
}

export const SchematicComponentMouseTarget = ({
  componentId,
  svgDivRef,
  containerRef,
  onComponentClick,
  onHoverChange,
  showOutline,
  circuitJsonKey,
}: Props) => {
  const measurement = useSvgElementMeasurement({
    selector: `[data-schematic-component-id="${componentId}"]`,
    svgDivRef,
    containerRef,
    circuitJsonKey,
  })

  const handleClick = useCallback(
    (event: MouseEvent) => {
      if (onComponentClick) {
        onComponentClick(componentId, event)
      }
    },
    [componentId, onComponentClick],
  )

  const bounds = measurement?.bounds ?? null

  const { hovering } = useMouseEventsOverBoundingBox({
    bounds,
    onClick: onComponentClick ? handleClick : undefined,
  })

  // Notify parent of hover state changes
  useEffect(() => {
    if (onHoverChange) {
      onHoverChange(componentId, hovering)
    }
  }, [hovering, componentId, onHoverChange])

  if (!measurement || !hovering || !showOutline) {
    return null
  }

  const rect = measurement.rect

  return (
    <div
      style={{
        position: "absolute",
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        border: "1.5px solid rgba(51, 153, 255, 0.9)",
        pointerEvents: "none",
        zIndex: zIndexMap.schematicComponentHoverOutline,
      }}
    />
  )
}
