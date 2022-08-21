import { ProjectBuilder } from "../project-builder"
import { BaseComponentBuilder, ComponentBuilderClass } from "./ComponentBuilder"
import * as Type from "lib/types"
import { transformSchematicElements } from "../transform-elements"
import { compose, rotate, translate } from "transformation-matrix"
import { PortsBuilder } from "../ports-builder"
import { Except } from "type-fest"

export type ResistorBuilderCallback = (rb: ResistorBuilder) => unknown
export interface ResistorBuilder extends BaseComponentBuilder<ResistorBuilder> {
  setSourceProperties(
    properties: Except<
      Type.SimpleResistor,
      "type" | "source_component_id" | "ftype" | "name"
    > & { name?: string }
  ): ResistorBuilder
}

export class ResistorBuilderClass
  extends ComponentBuilderClass
  implements ResistorBuilder
{
  constructor(project_builder: ProjectBuilder) {
    super(project_builder)
    this.source_properties = {
      ...this.source_properties,
      ftype: "simple_resistor",
    }
  }

  setSourceProperties(props: Type.SimpleResistor) {
    this.source_properties = {
      ...this.source_properties,
      ...props,
    }
    return this
  }

  async build() {
    const elements: Type.AnyElement[] = []
    const { ftype } = this.source_properties
    const { project_builder } = this
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
      rotation: this.schematic_rotation,
      size: {
        width: 1,
        height: 12 / 40,
      },
      center: this.schematic_position || { x: 0, y: 0 },
      ...this.schematic_properties,
    }
    elements.push(schematic_component)

    this.ports.setSchematicComponent(schematic_component_id)
    this.ports.setSourceComponent(source_component_id)

    const textElements = []

    this.ports.add("left", { x: -0.5, y: 0 })
    this.ports.add("right", { x: 0.5, y: 0 })
    const [text_pos1, text_pos2] =
      schematic_component.rotation === Math.PI / 2 ||
      schematic_component.rotation === -Math.PI / 2
        ? [
            { x: -0.2, y: -0.3 },
            { x: 0, y: -0.3 },
          ]
        : [
            { x: -0.2, y: -0.5 },
            { x: -0.2, y: -0.3 },
          ]

    textElements.push({
      type: "schematic_text",
      text: source_component.name,
      schematic_text_id: project_builder.getId("schematic_text"),
      schematic_component_id,
      anchor: "left",
      position: text_pos1,
    })
    textElements.push({
      type: "schematic_text",
      text: source_component.resistance,
      schematic_text_id: project_builder.getId("schematic_text"),
      schematic_component_id,
      anchor: "left",
      position: text_pos2,
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

export const createResistorBuilder = (
  project_builder: ProjectBuilder
): ResistorBuilder => {
  return new ResistorBuilderClass(project_builder)
}
