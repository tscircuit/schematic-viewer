import * as Type from "lib/types"
import SVGPathComponent from "./SVGPathComponent"
import range from "lodash/range"

interface Props {
  component: {
    source: Type.SimpleBug
    schematic: Type.SchematicComponent
  }
}

export const SchematicBug = ({ component: { source, schematic } }: Props) => {
  const ports_arrangement = schematic.port_arrangement!
  const port_labels = schematic.port_labels!
  const bugw = (ports_arrangement.left_size + ports_arrangement.right_size) * 4
  const bugh = ports_arrangement.left_size * 10
  const rowHeight = 10
  const linePadding = 3
  return (
    <SVGPathComponent
      rotation={schematic.rotation}
      center={schematic.center}
      size={schematic.size}
      paths={[
        {
          stroke: "red",
          strokeWidth: 1,
          d: `M 0 0 L ${bugw} 0 L ${bugw} ${bugh} L 0 ${bugh}Z`,
        },
        ...range(
          0,
          ports_arrangement.left_size + ports_arrangement.right_size
        ).map((i) => {
          const left = i < ports_arrangement.left_size
          const rowi = i % ports_arrangement.left_size
          return {
            stroke: "red",
            strokeWidth: 1,
            d: `M ${linePadding + (left ? 0 : bugw)} ${
              linePadding + rowHeight / 2 + rowHeight * rowi
            } l ${left ? -15 : 15} 0`,
          }
        }),
      ]}
    />
  )
}

export default SchematicBug
