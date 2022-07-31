import { ProjectClass } from "lib/project"
import * as Type from "lib/types"
import * as Component from "./"

interface Props {
  port: {
    source: Type.SourcePort
    schematic: Type.SchematicPort
  }
}

export const SchematicPort = ({ port: { source, schematic } }: Props) => {
  return (
    <Component.SVGPathComponent
      rotation={0}
      center={schematic.center}
      size={{ width: 0.2, height: 0.2 }}
      paths={[
        {
          stroke: "blue",
          strokeWidth: 1,
          d: "M 0 0 l 10 0 l 0 10 l -10 0 l 0 -10",
        },
      ]}
    />
  )
}

export default SchematicPort
