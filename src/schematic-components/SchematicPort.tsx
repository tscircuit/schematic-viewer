import * as Type from "lib/types"
import { directionToVec } from "lib/utils/direction-to-vec"
import * as Component from "./"
import { useState } from "react"

interface Props {
  port: {
    source_port: Type.SourcePort
    source_component: Type.SourceComponent
    schematic: Type.SchematicPort
  }
}

export const SchematicPort = ({
  port: { source_port, source_component, schematic },
}: Props) => {
  const hoverName = source_component?.name
    ? `.${source_component.name} > .${
        source_port?.name ?? source_port?.pin_number
      }`
    : `.${source_port?.name ?? source_port?.pin_number}`
  const vec = directionToVec(schematic.facing_direction)
  return (
    <Component.SVGPathComponent
      rotation={0}
      hoverContent={
        <div>
          {hoverName}
          <br />
          {source_port?.pin_number && `Pin ${source_port.pin_number}`}
          {/* <br />
          <div style={{ opacity: 0.5 }}>
            {schematic.schematic_port_id}
            <br />
            {schematic.source_port_id}
          </div> */}
        </div>
      }
      center={schematic.center}
      size={{
        width: 0.2 + Math.abs(vec.x) * 0.04,
        height: 0.2 + Math.abs(vec.y) * 0.04,
      }}
      zIndex={10}
      paths={[
        {
          stroke: "blue",
          strokeWidth: 1,
          d: "M 0 0 l 10 0 l 0 10 l -10 0 z",
        },
        schematic.facing_direction
          ? {
              stroke: "blue",
              strokeWidth: 0.5,
              d: `M 5 5 l ${vec.x * 7} ${vec.y * 7}`,
            }
          : null,
      ].filter(Boolean)}
    />
  )
}

export default SchematicPort
