import * as Type from "lib/types"
import SVGPathComponent from "./SVGPathComponent"

interface Props {
  component: {
    source: Type.SimpleGround
    schematic: Type.SchematicComponent
  }
}

export const SimpleGround = ({ component: { source, schematic } }: Props) => {
  return (
    <SVGPathComponent
      rotation={schematic.rotation}
      center={schematic.center}
      size={schematic.size}
      paths={[
        {
          stroke: "red",
          strokeWidth: 0.7,
          d: "M -3 3 L 3 3 M -6 0 L 6 0 M -9 -3 L 9 -3 M 0 -3 L 0 -12",
        },
      ]}
    />
  )
}

export default SimpleGround
