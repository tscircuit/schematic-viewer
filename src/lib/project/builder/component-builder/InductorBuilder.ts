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

  build() {
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

    // Ports can usually be determined via the ftype and dimensions
    switch (source_component.ftype) {
      case "simple_capacitor": {
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
        textElements.push({
          type: "schematic_text",
          text: source_component.capacitance,
          schematic_text_id: project_builder.getId("schematic_text"),
          schematic_component_id,
          anchor: "left",
          position: { x: -0.3, y: -0.3 },
        })
        break
      }
      case "simple_resistor": {
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
        break
      }
      case "simple_ground": {
        this.ports.add("gnd", { x: 0, y: -0.2 })
        break
      }
      case "simple_power_source": {
        this.ports.add("positive", { x: 0, y: -0.5 })
        this.ports.add("negative", { x: 0, y: 0.5 })
        break
      }
      case "simple_bug": {
        // add ports based on port arangement and give appropriate labels
        const { port_labels, port_arrangement } = this.schematic_properties
        for (
          let i = 0;
          i < port_arrangement.left_size + port_arrangement.right_size;
          i++
        ) {
          const portPosition = getPortPosition(port_arrangement, i)
          this.ports.add(port_labels[i + 1], portPosition)
          const schematic_text_id = this.project_builder.getId("schematic_text")
          const is_left = i < port_arrangement.left_size
          const portText: Type.SchematicText = {
            type: "schematic_text",
            schematic_text_id,
            schematic_component_id,
            text: port_labels[i + 1],
            anchor: is_left ? "left" : "right",
            position: {
              x: portPosition.x + (is_left ? 0.3 : -0.3),
              y: portPosition.y,
            },
          }
          textElements.push(portText)
        }
        break
      }
    }
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
