import * as Type from "lib/types"
import SVGPathComponent from "./SVGPathComponent"

interface Props {
  component: {
    source: Type.SimpleCapacitor
    schematic: Type.SchematicComponent
  }
}

export const SimpleCapacitor = ({
  component: { source, schematic },
}: Props) => {
  return (
    <SVGPathComponent
      rotation={schematic.rotation}
      center={schematic.center}
      size={schematic.size}
      paths={[
        { stroke: "red", strokeWidth: 1, d: "M 0 15 l 12 0" },
        { stroke: "red", strokeWidth: 1, d: "M 12 0 l 0 30" },
        { stroke: "red", strokeWidth: 1, d: "M 18 0 l 0 30" },
        { stroke: "red", strokeWidth: 1, d: "M 18 15 l 12 0" },
      ]}
    />
  )
}

export default SimpleCapacitor
