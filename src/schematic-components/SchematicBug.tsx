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
  const bugw = 30 // bug width
  const rh = 15 // row height
  const pd = 7.5 // port distance, the line for each port
  const bugh =
    Math.max(ports_arrangement.left_size, ports_arrangement.right_size) * rh
  // TODO throw if schematic.size doesn't match computed ports_arrangement size
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
          const ls = ports_arrangement.left_size
          const left = i < ls
          const rowi = i % ls
          const p1 = [left ? 0 : bugw, rh / 2 + rowi * rh]
          const rd = [left ? -pd : pd, 0]
          return {
            stroke: "red",
            strokeWidth: 1,
            d: `M ${p1.join(" ")} l ${rd.join(" ")}`,
          }
        }),
      ]}
    />
  )
}

export default SchematicBug
