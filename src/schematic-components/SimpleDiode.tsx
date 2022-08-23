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
      size={schematic.size}
      paths={[
        // https://commons.wikimedia.org/wiki/File:Electrical_symbols_library.svg
        { stroke: "red", strokeWidth: 2, d: "m 805,262.41665 h 21" },
        { stroke: "red", strokeWidth: 2, d: "M 854.00002,262.41665 H 868" },
        { stroke: "red", strokeWidth: 2, d: "m 854,262.41665 -28,14 v -28 z" },
        { stroke: "red", strokeWidth: 2, d: "m 854,248.41665 v 28" },
      ]}
    />
  )
}

export default SimpleDiode
