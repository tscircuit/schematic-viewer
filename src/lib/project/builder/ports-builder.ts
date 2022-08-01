import * as Type from "lib/types"
import { Except, Simplify } from "type-fest"
import { ProjectBuilder } from "./project-builder"

export type PortBuilderCallback = (cb: PortsBuilder) => unknown
export interface PortsBuilder {
  project_builder: ProjectBuilder
  add: (portName: string, schematicPosition: Type.Point) => PortsBuilder
  setSourceComponent: (source_component_id: string) => PortsBuilder
  setSchematicComponent: (schematic_component_id: string) => PortsBuilder
  setPCBComponent: (pcb_component_id: string) => PortsBuilder
  build(): Type.AnyElement[]
}

export const createPortsBuilder = (
  project_builder: ProjectBuilder
): PortsBuilder => {
  const builder: PortsBuilder = { project_builder } as any

  const internal = {
    source_component_id: "",
    schematic_component_id: "",
    pcb_component_id: "",
    ports: [] as Array<{
      name: string
      schematic_position: Type.Point
    }>,
  }

  builder.add = (name, schematic_position) => {
    internal.ports.push({
      name,
      schematic_position,
    })
    return builder
  }

  builder.setSourceComponent = (source_component_id) => {
    internal.source_component_id = source_component_id
    return builder
  }
  builder.setSchematicComponent = (schematic_component_id) => {
    internal.schematic_component_id = schematic_component_id
    return builder
  }
  builder.setPCBComponent = (pcb_component_id) => {
    internal.pcb_component_id = pcb_component_id
    return builder
  }

  builder.build = () => {
    return internal.ports.flatMap((port) => {
      const source_port_id = project_builder.getId("source_port")
      const schematic_port_id = project_builder.getId("schematic_port")
      const pcb_port_id = project_builder.getId("pcb_port")
      return [
        {
          type: "source_port",
          name: port.name,
          source_port_id,
          source_component_id: internal.source_component_id,
        } as Type.SourcePort,
        {
          type: "schematic_port",
          schematic_port_id,
          source_port_id,
          center: port.schematic_position,
        } as Type.SchematicPort,
      ] as Type.AnyElement[]
    }) as Type.AnyElement[]
  }

  return builder
}
