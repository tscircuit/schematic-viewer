import * as Type from "lib/types"
import { Except, Simplify } from "type-fest"
import { ProjectBuilder } from "./project-builder"

export type ComponentBuilderCallback = (cb: ComponentBuilder) => unknown
export interface ComponentBuilder {
  project_builder: ProjectBuilder
  setName: (name: string) => ComponentBuilder
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
  const builder: ComponentBuilder = { project_builder } as any
  const internal: any = {}

  builder.setName = (name: string) => {
    internal.name = name
    return builder
  }
  builder.setSourceProperties = (ftype: string, props: any) => {
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
    elements.push({
      type: "source_component",
      source_component_id,
      name: internal.name,
      ...internal.source_properties,
    })
    elements.push({
      type: "schematic_component",
      source_component_id,
      schematic_component_id: project_builder.getId(`sch_${ftype}`),
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
    })
    elements.push({
      type: "pcb_component",
      source_component_id,
      pcb_component_id: project_builder.getId(`pcb_${ftype}`),
    })
    return elements
  }

  return builder
}
