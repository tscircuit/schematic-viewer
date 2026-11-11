import { useSvgElementMeasurement } from "../hooks/useSvgElementMeasurement"
import { zIndexMap } from "../utils/z-index-map"

/** Dashed outline around one element of the rendered schematic. */
export const SchematicElementHighlight = ({
  selector,
  svgDivRef,
  containerRef,
  circuitJsonKey,
}: {
  selector: string
  svgDivRef: React.RefObject<HTMLDivElement | null>
  containerRef: React.RefObject<HTMLDivElement | null>
  circuitJsonKey: string
}) => {
  const measurement = useSvgElementMeasurement({
    selector,
    svgDivRef,
    containerRef,
    circuitJsonKey,
    padding: 4,
  })

  if (!measurement) return null

  return (
    <div
      data-schematic-element-highlight
      style={{
        position: "absolute",
        left: measurement.rect.left,
        top: measurement.rect.top,
        width: measurement.rect.width,
        height: measurement.rect.height,
        border: "1.5px dashed #3b82f6",
        boxSizing: "border-box",
        pointerEvents: "none",
        zIndex: zIndexMap.schematicElementHighlight,
      }}
    />
  )
}
