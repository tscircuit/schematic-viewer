import { ProjectBuilder } from "../project-builder"
import { BaseComponentBuilder, ComponentBuilderClass } from "./ComponentBuilder"
import * as Type from "lib/types"
import { transformSchematicElements } from "../transform-elements"
import { compose, rotate, translate } from "transformation-matrix"
import { PortsBuilder } from "../ports-builder"
import { Except } from "type-fest"
import getPortPosition from "./get-port-position"

export type PowerSourceBuilderCallback = (rb: PowerSourceBuilder) => unknown
export interface PowerSourceBuilder
  extends BaseComponentBuilder<PowerSourceBuilder> {
  setSourceProperties(
    properties: Except<
      Type.SimplePowerSource,
      "type" | "source_component_id" | "ftype" | "name"
    > & { name?: string }
  ): PowerSourceBuilder
}

export class PowerSourceBuilderClass
  extends ComponentBuilderClass
  implements PowerSourceBuilder
{
  constructor(project_builder: ProjectBuilder) {
    super(project_builder)
    this.source_properties = {
      ...this.source_properties,
      ftype: "simple_power_source",
    }
  }

  setSourceProperties(props: Type.SimplePowerSource) {
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
      size: { width: (1 * 24) / 34, height: 1 },
      center: this.schematic_position || { x: 0, y: 0 },
      ...this.schematic_properties,
    }
    elements.push(schematic_component)

    this.ports.setSchematicComponent(schematic_component_id)
    this.ports.setSourceComponent(source_component_id)

    const textElements = []

    this.ports.add({
      name: "positive",
      center: { x: 0, y: -0.5 },
      facing_direction: "up",
    })
    this.ports.add({
      name: "negative",
      center: { x: 0, y: 0.5 },
      facing_direction: "down",
    })

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

export const createPowerSourceBuilder = (
  project_builder: ProjectBuilder
): PowerSourceBuilder => {
  return new PowerSourceBuilderClass(project_builder)
}
