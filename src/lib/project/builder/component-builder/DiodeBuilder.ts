import { ProjectBuilder } from "../project-builder"
import { BaseComponentBuilder, ComponentBuilderClass } from "./ComponentBuilder"
import * as Type from "lib/types"
import { transformSchematicElements } from "../transform-elements"
import { compose, rotate, translate } from "transformation-matrix"
import { PortsBuilder } from "../ports-builder"
import { Except } from "type-fest"
import getPortPosition from "./get-port-position"

export type DiodeBuilderCallback = (rb: DiodeBuilder) => unknown
export interface DiodeBuilder extends BaseComponentBuilder<DiodeBuilder> {
  setSourceProperties(
    properties: Except<
      Type.SimpleDiode,
      "type" | "source_component_id" | "ftype" | "name"
    > & { name?: string }
  ): DiodeBuilder
}

export class DiodeBuilderClass
  extends ComponentBuilderClass
  implements DiodeBuilder
{
  constructor(project_builder: ProjectBuilder) {
    super(project_builder)
    this.source_properties = {
      ...this.source_properties,
      ftype: "simple_diode",
    }
  }

  setSourceProperties(props: Type.SimpleDiode) {
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
      size: { width: 0.63 * 1.2, height: 0.28 * 1.2 },
      center: this.schematic_position || { x: 0, y: 0 },
      ...this.schematic_properties,
    }
    elements.push(schematic_component)

    this.ports.setSchematicComponent(schematic_component_id)
    this.ports.setSourceComponent(source_component_id)

    const textElements = []

    this.ports.add("left", { x: -0.5, y: 0 })
    this.ports.add("right", { x: 0.5, y: 0 })

    const isFlipped = Math.abs(schematic_component.rotation) >= Math.PI
    textElements.push({
      type: "schematic_text",
      text: source_component.name,
      schematic_text_id: project_builder.getId("schematic_text"),
      schematic_component_id,
      anchor: "left",
      position: {
        x: -0.5 * (isFlipped ? -1 : 1),
        y: -0.3 * (isFlipped ? -1 : 1),
      },
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

export const createDiodeBuilder = (
  project_builder: ProjectBuilder
): DiodeBuilder => {
  return new DiodeBuilderClass(project_builder)
}
