import { ProjectBuilder } from "../project-builder"
import { BaseComponentBuilder, ComponentBuilderClass } from "./ComponentBuilder"
import * as Type from "lib/types"
import { transformSchematicElements } from "../transform-elements"
import { compose, rotate, translate } from "transformation-matrix"
import { PortsBuilder } from "../ports-builder"
import { Except } from "type-fest"

export type GroundBuilderCallback = (rb: GroundBuilder) => unknown
export interface GroundBuilder extends BaseComponentBuilder<GroundBuilder> {
  setSourceProperties(
    properties: Except<
      Type.SimpleGround,
      "type" | "source_component_id" | "ftype" | "name"
    > & { name?: string }
  ): GroundBuilder
}

export class GroundBuilderClass
  extends ComponentBuilderClass
  implements GroundBuilder
{
  constructor(project_builder: ProjectBuilder) {
    super(project_builder)
    this.source_properties = {
      ...this.source_properties,
      ftype: "simple_ground",
    }
  }

  setSourceProperties(props: Type.SimpleGround) {
    this.source_properties = {
      ...this.source_properties,
      ...props,
    }
    return this
  }

  async build() {
    const elements: Type.AnyElement[] = []
    const { project_builder } = this
    const { ftype } = this.source_properties
    const source_component_id = project_builder.getId(ftype)
    const schematic_component_id = project_builder.getId(
      `schematic_component_${ftype}`
    )
    const pcb_component_id = project_builder.getId(`pcb_component_${ftype}`)
    const source_component = {
      type: "source_component",
      source_component_id,
      name: this.name,
      ...this.source_properties,
    }
    elements.push(source_component)

    const port_arrangement = this.schematic_properties?.port_arrangement
    const schematic_component: Type.SchematicComponent = {
      type: "schematic_component",
      source_component_id,
      schematic_component_id,
      rotation: this.schematic_rotation ?? 0,
      size:
        ftype === "simple_capacitor"
          ? { width: 3 / 4, height: 3 / 4 }
          : ftype === "simple_resistor"
          ? {
              width: 1,
              height: 12 / 40,
            }
          : ftype === "simple_bug"
          ? {
              width:
                Math.max(
                  port_arrangement.top_size ?? 0,
                  port_arrangement.bottom_size ?? 0,
                  1
                ) + 0.5,
              height: Math.max(
                (port_arrangement.left_size ?? 0) / 2,
                (port_arrangement.right_size ?? 0) / 2,
                1
              ),
            }
          : ftype === "simple_ground"
          ? {
              width: 0.5,
              height: (0.5 * 15) / 18,
            }
          : ftype === "simple_power_source"
          ? { width: (1 * 24) / 34, height: 1 }
          : { width: 1, height: 1 },
      center: this.schematic_position || { x: 0, y: 0 },
      ...this.schematic_properties,
    }
    elements.push(schematic_component)

    this.ports.setSchematicComponent(schematic_component_id)
    this.ports.setSourceComponent(source_component_id)

    const textElements = []

    this.ports.add("gnd", { x: 0, y: -0.2 })

    elements.push(
      ...transformSchematicElements(
        [...this.ports.build(), ...textElements],
        compose(
          translate(schematic_component.center.x, schematic_component.center.y),
          rotate(schematic_component.rotation)
        )
      )
    )

    elements.push({
      type: "pcb_component",
      source_component_id,
      pcb_component_id,
    })
    return elements
  }
}

export const createGroundBuilder = (
  project_builder: ProjectBuilder
): GroundBuilder => {
  return new GroundBuilderClass(project_builder)
}
