import * as Type from "../lib/types"
import SVGPathComponent from "./SVGPathComponent"

interface Props {
  component: {
    source: Type.Switch
    schematic: Type.SchematicComponent
  }
}

export const Switch = ({
  component: { source, schematic },
}: Props) => {
  return (
    <SVGPathComponent
      rotation={schematic.rotation}
      center={schematic.center}
      size={schematic.size}
      paths={[
        { stroke: "black", strokeWidth: 2, d: "M 10 30 L 30 30" },
        { stroke: "black", strokeWidth: 2, d: "M 30 30 L 70 " + (source.closed ? "30" : "10") },
        { stroke: "black", strokeWidth: 2, d: "M 70 30 L 90 30" },
        {
          fill: "black", d: "M 30 30 m -3 0 a 3,3 0 1,0 6,0 a 3,3 0 1,0 -6,0",
          strokeWidth: 0,
          stroke: ""
        },
        {
          fill: "black", d: "M 90 30 m -3 0 a 3,3 0 1,0 6,0 a 3,3 0 1,0 -6,0",
          strokeWidth: 0,
          stroke: ""
        }
      ]}
    />
  )
}

export default Switch