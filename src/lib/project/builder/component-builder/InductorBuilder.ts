import { ProjectBuilder } from "../project-builder"
import { BaseComponentBuilder, ComponentBuilderClass } from "./ComponentBuilder"
import * as Type from "lib/types"
import { transformSchematicElements } from "../transform-elements"
import { compose, rotate, translate } from "transformation-matrix"
import { PortsBuilder } from "../ports-builder"
import getPortPosition from "./get-port-position"

export type InductorBuilderCallback = (rb: InductorBuilder) => unknown
export interface InductorBuilder extends BaseComponentBuilder<InductorBuilder> {
  setSourceProperties(
    properties: Type.SimpleInductor & { name?: string }
  ): InductorBuilder
}

export class InductorBuilderClass
  extends ComponentBuilderClass
  implements InductorBuilder
{
  constructor(project_builder: ProjectBuilder) {
    super(project_builder)
    this.source_properties = {
      ...this.source_properties,
      ftype: "simple_inductor",
    }
  }

  setSourceProperties(props: Type.SimpleInductor) {
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
      size: { width: 3 / 4, height: 3 / 4 },
      center: this.schematic_position || { x: 0, y: 0 },
      ...this.schematic_properties,
    }
    elements.push(schematic_component)

    this.ports.setSchematicComponent(schematic_component_id)
    this.ports.setSourceComponent(source_component_id)

    const textElements = []

    this.ports.add("left", { x: -0.5, y: 0 })
    this.ports.add("right", { x: 0.5, y: 0 })
    textElements.push({
      type: "schematic_text",
      text: source_component.name,
      schematic_text_id: project_builder.getId("schematic_text"),
      schematic_component_id,
      anchor: "left",
      position: { x: -0.5, y: -0.3 },
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

export const createInductorBuilder = (
  project_builder: ProjectBuilder
): InductorBuilder => {
  return new InductorBuilderClass(project_builder)
}
