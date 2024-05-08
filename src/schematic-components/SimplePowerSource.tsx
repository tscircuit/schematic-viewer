import * as Type from "lib/types"
import SVGPathComponent from "./SVGPathComponent"

interface Props {
  component: {
    source: Type.SimplePowerSource
    schematic: Type.SchematicComponent
  }
}

export const SimplePowerSource = ({
  component: { source, schematic },
}: Props) => {
  return (
    <SVGPathComponent
      rotation={schematic.rotation}
      center={schematic.center}
      size={schematic.size}
      invertY
      paths={[
        {
          stroke: "red",
          strokeWidth: 1,
          d: "M 0 -17 L 0 -3 M -8 3 L 8 3 M 0 17 L 0 3 M -12 -3 L 12 -3",
        },
        // positive symbol
        {
          stroke: "red",
          strokeWidth: 0.5,
          d: "M 8 -9 L 8 -6 M 9.5 -7.5 L 6.5 -7.5",
        },
        // negative symbol
        {
          stroke: "red",
          strokeWidth: 0.5,
          d: "M 9.5 7.5 L 6.5 7.5",
        },
      ]}
    />
  )
}

export default SimplePowerSource
