import type { SchematicNetLabel as SchematicNetLabelObject } from "@tscircuit/soup"
import SVGPathComponent from "./SVGPathComponent"
import SchematicText from "./SchematicText"

export const SchematicNetLabel = ({
  net_label,
}: {
  net_label: SchematicNetLabelObject
}) => {
  console.log({ net_label })
  const text_width = net_label.text.length * 0.15
  // TODO add text
  const path_width = 31 + net_label.text.length * 5
  return (
    <>
      <SVGPathComponent
        rotation={0}
        center={net_label.center}
        // fixed size?
        size={{
          width: 0.05 + text_width,
          height: 0.175,
        }}
        paths={[
          {
            stroke: "gray",
            strokeWidth: 0.75,
            d: `M 0 15 L 5 15 L 11 9 L ${path_width} 9 L ${path_width} 21 L 11 21 L 5 15`,
          },
        ]}
      />
      <SchematicText
        schematic_text={{
          anchor: "left",
          position: {
            x: net_label.center.x - text_width / 4 + 0.025,
            y: net_label.center.y,
          },
          schematic_component_id: "SYNTHETIC",
          schematic_text_id: "SYNTHETIC",
          text: net_label.text,
          type: "schematic_text",
        }}
      />
    </>
  )
}
