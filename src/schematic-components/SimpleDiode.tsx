import * as Type from "lib/types"
import SVGPathComponent from "./SVGPathComponent"

interface Props {
  component: {
    source: Type.SimpleDiode
    schematic: Type.SchematicComponent
  }
}

export const SimpleDiode = ({ component: { source, schematic } }: Props) => {
  return (
    <SVGPathComponent
      rotation={schematic.rotation}
      center={schematic.center}
      // size={schematic.size}
      size={{
        height: 0.5,
        width: 1,
      }}
      paths={[
        { stroke: "red", strokeWidth: 2, d: "M 0,0 H 21" },
        { stroke: "red", strokeWidth: 2, d: "M 49,0 H 59" },
        { stroke: "red", strokeWidth: 2, d: "M 49,0 L 21 14 V -14 Z" },
        { stroke: "red", strokeWidth: 2, d: "M 49,-14 V 14" },
        // For LEDs
        // {
        //   stroke: "red",
        //   strokeWidth: 2,
        //   d: "M 35 -32 l 7 5.25 l 1.75 -9.625 z m 3.5 2.625 l -5.25 7",
        // },
        // {
        //   stroke: "red",
        //   strokeWidth: 2,
        //   d: "M 52 -26 l 7 5.25 l 1.75 -9.625 z m 3.5 2.625 l -5.25 7",
        // },
      ]}
    />
  )
}

export default SimpleDiode
