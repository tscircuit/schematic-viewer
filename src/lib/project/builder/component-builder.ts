import { SchematicComponent } from "./../../types/core"
import * as Type from "lib/types"
import { Except, Simplify } from "type-fest"
import { ProjectBuilder } from "./project-builder"
import { PortsBuilder, createPortsBuilder } from "./ports-builder"

export type ComponentBuilderCallback = (cb: ComponentBuilder) => unknown
export interface ComponentBuilder {
  project_builder: ProjectBuilder
  ports: PortsBuilder
  setName: (name: string) => ComponentBuilder
  tag: (tag: string) => ComponentBuilder
  setSourceProperties<T extends Type.SourceComponentFType>(
    ftype: T,
    properties: Simplify<
      Except<
        Extract<Type.SourceComponent, { ftype: T }>,
        "type" | "source_component_id" | "ftype" | "name"
      >
    > & { name?: string }
  ): ComponentBuilder
  setSchematicCenter(x: number, y: number): ComponentBuilder
  setSchematicRotation(rotation: number | `${number}deg`): ComponentBuilder
  build(): Type.AnyElement[]
}

export const createComponentBuilder = (
  project_builder: ProjectBuilder
): ComponentBuilder => {
  const builder: ComponentBuilder = {
    project_builder,
    ports: createPortsBuilder(project_builder),
  } as any
  const internal: any = {
    tags: [],
  }

  builder.tag = (tag) => {
    internal.tags.push(tag)
    return builder
  }
  builder.setName = (name) => {
    internal.name = name
    return builder
  }
  builder.setSourceProperties = (ftype, props) => {
    internal.source_properties = {
      ftype,
      ...props,
    }
    return builder
  }
  builder.setSchematicCenter = (x: number, y: number) => {
    internal.schematic_position = { x, y }
    return builder
  }
  builder.setSchematicRotation = (rotation) => {
    if (typeof rotation === "number") {
      internal.schematic_rotation = rotation
    } else {
      internal.schematic_rotation =
        (parseFloat(rotation.split("deg")[0]) / 180) * Math.PI
    }
    return builder
  }

  builder.build = () => {
    const elements: Type.AnyElement[] = []
    const { ftype } = internal.source_properties
    const source_component_id = project_builder.getId(ftype)
    const schematic_component_id = project_builder.getId(
      `schematic_component_${ftype}`
    )
    const pcb_component_id = project_builder.getId(`pcb_component_${ftype}`)
    const source_component = {
      type: "source_component",
      source_component_id,
      name: internal.name,
      ...internal.source_properties,
    }
    elements.push(source_component)

    const schematic_component: SchematicComponent = {
      type: "schematic_component",
      source_component_id,
      schematic_component_id,
      rotation: internal.schematic_rotation ?? 0,
      size:
        ftype === "simple_capacitor"
          ? { width: 3 / 4, height: 3 / 4 }
          : ftype === "simple_resistor"
          ? {
              width: 1,
              height: 12 / 40,
            }
          : { width: 1, height: 1 },
      center: internal.schematic_position || { x: 0, y: 0 },
    }
    elements.push(schematic_component)

    builder.ports.setSchematicComponent(schematic_component_id)
    builder.ports.setSourceComponent(source_component_id)

    // Ports can usually be determined via the ftype and dimensions
    switch (source_component.ftype) {
      case "simple_capacitor": {
        builder.ports.add("left", { x: 0, y: 0 })
        builder.ports.add("right", { x: 1, y: 0 })
      }
      case "simple_resistor": {
        builder.ports.add("left", { x: 0, y: 0 })
        builder.ports.add("right", { x: 1, y: 0 })
      }
    }
    elements.push(...builder.ports.build())

    elements.push({
      type: "pcb_component",
      source_component_id,
      pcb_component_id,
    })
    return elements
  }

  return builder
}
