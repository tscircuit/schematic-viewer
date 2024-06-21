import type { SchematicNetLabel as SchematicNetLabelObject } from "@tscircuit/soup"
import SVGPathComponent from "./SVGPathComponent"
import SchematicText from "./SchematicText"
import { getRotationFromAnchorSide } from "lib/utils/get-rotation-from-anchor-side"
import { getVecFromAnchorSide } from "lib/utils/get-vec-from-anchor-side"

export const SchematicNetLabel = ({
  net_label,
}: {
  net_label: SchematicNetLabelObject
}) => {
  const anchor_side = net_label.anchor_side
  const is_vertical = anchor_side === "top" || anchor_side === "bottom"
  const text_width = is_vertical ? 0.3 : net_label.text.length * 0.15
  // TODO add text
  const path_width = 31 + net_label.text.length * 5

  const anchor_vec = getVecFromAnchorSide(anchor_side)
  // const anchor_dist = 0 // text_width / 4 - 0.025
  const anchor_dist = is_vertical ? 0.04 : text_width / 4 // - 0.025
  anchor_vec.x *= anchor_dist
  anchor_vec.y *= anchor_dist

  return (
    <>
      <SVGPathComponent
        rotation={getRotationFromAnchorSide(anchor_side)}
        center={net_label.center}
        // fixed size?
        size={{
          width: 0.05 + text_width,
          height:
            0.2 +
            (is_vertical ? 0.1 * Math.max(1, net_label.text.length - 2) : 0),
        }}
        paths={[
          {
            stroke: "gray",
            strokeWidth: 0.75,
            // d: `M 0 15 L 5 15 L 11 9 L ${path_width} 9 L ${path_width} 21 L 11 21 L 5 15`,
            d: `M 0 15 L 5 15 L 11 5 L ${path_width} 5 L ${path_width} 26 L 11 26 L 5 15`,
          },
        ]}
      />
      <SchematicText
        schematic_text={{
          anchor: is_vertical ? "center" : anchor_side,
          position: {
            x: net_label.center.x + anchor_vec.x,
            y: net_label.center.y + anchor_vec.y,
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
