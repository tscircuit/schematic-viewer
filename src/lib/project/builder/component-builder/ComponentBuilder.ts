import * as Type from "lib/types"
import { Except, Simplify } from "type-fest"
import { ProjectBuilder } from "lib/project/builder/project-builder"
import {
  PortsBuilder,
  createPortsBuilder,
} from "lib/project/builder/ports-builder"
import { compose, rotate, transform, translate } from "transformation-matrix"
import { transformSchematicElements } from "lib/project/builder//transform-elements"
import getPortPosition from "./get-port-position"
import { Point, SchematicComponent } from "lib/types"

export type ComponentBuilderCallback = (cb: ComponentBuilder) => unknown
export interface ComponentBuilder {
  project_builder: ProjectBuilder
  ports: PortsBuilder
  setName: (name: string) => ComponentBuilder
  setTag: (tag: string) => ComponentBuilder
  setTags: (tags: string[]) => ComponentBuilder
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
  setSchematicProperties(
    properties: Partial<Type.SchematicComponent>
  ): ComponentBuilder
  labelPort(position: number, name: string): ComponentBuilder
  build(): Type.AnyElement[]
}

export class ComponentBuilderClass implements ComponentBuilder {
  name: string = null
  tags: string[] = []
  source_properties: any = {}
  schematic_properties: any = {}
  schematic_rotation: number = 0
  schematic_position: Point = { x: 0, y: 0 }
  ports: PortsBuilder
  constructor(public project_builder: ProjectBuilder) {
    this.ports = createPortsBuilder(project_builder)
  }

  setTag(tag) {
    this.tags.push(tag)
    return this
  }

  setTags(tags) {
    this.tags.push(...tags)
    return this
  }

  setName(name) {
    this.name = name
    return this
  }

  setSourceProperties(ftype, props) {
    this.source_properties = {
      ftype,
      ...props,
    }
    return this
  }

  setSchematicCenter(x, y) {
    this.schematic_position = { x, y }
    return this
  }

  setSchematicRotation(rotation) {
    if (typeof rotation === "number") {
      this.schematic_rotation = rotation
    } else {
      this.schematic_rotation =
        (parseFloat(rotation.split("deg")[0]) / 180) * Math.PI
    }
    return this
  }

  setSchematicProperties(props) {
    this.schematic_properties = {
      ...this.schematic_properties,
      ...props,
    }
    return this
  }

  labelPort(position, name) {
    this.schematic_properties.port_labels ??= {}
    this.schematic_properties.port_labels[position] = name
    return this
  }

  build() {
    return []
  }
}

export const createComponentBuilder = (
  project_builder: ProjectBuilder
): ComponentBuilder => {
  return new ComponentBuilderClass(project_builder)
  // const builder: ComponentBuilder = {
  //   project_builder,
  //   ports: createPortsBuilder(project_builder),
  // } as any
  // const internal: any = {
  //   tags: [],
  //   port_labels: [],
  //   schematic_properties: {},
  // }

  // builder.setTag = (tag) => {
  //   internal.tags.push(tag)
  //   return builder
  // }
  // builder.setName = (name) => {
  //   internal.name = name
  //   return builder
  // }
  // builder.setSourceProperties = (ftype, props) => {
  //   internal.source_properties = {
  //     ftype,
  //     ...props,
  //   }
  //   return builder
  // }
  // builder.setSchematicCenter = (x: number, y: number) => {
  //   internal.schematic_position = { x, y }
  //   return builder
  // }
  // builder.setSchematicRotation = (rotation) => {
  //   if (typeof rotation === "number") {
  //     internal.schematic_rotation = rotation
  //   } else {
  //     internal.schematic_rotation =
  //       (parseFloat(rotation.split("deg")[0]) / 180) * Math.PI
  //   }
  //   return builder
  // }
  // builder.setSchematicProperties = (props) => {
  //   internal.schematic_properties = {
  //     ...internal.schematic_properties,
  //     ...props,
  //   }
  //   return builder
  // }
  // builder.labelPort = (position, name) => {
  //   internal.schematic_properties.port_labels ??= {}
  //   internal.schematic_properties.port_labels[position] = name
  //   return builder
  // }

  // builder.build = () => {
  //   const elements: Type.AnyElement[] = []
  //   const { ftype } = internal.source_properties
  //   const source_component_id = project_builder.getId(ftype)
  //   const schematic_component_id = project_builder.getId(
  //     `schematic_component_${ftype}`
  //   )
  //   const pcb_component_id = project_builder.getId(`pcb_component_${ftype}`)
  //   const source_component = {
  //     type: "source_component",
  //     source_component_id,
  //     name: internal.name,
  //     ...internal.source_properties,
  //   }
  //   elements.push(source_component)

  //   const port_arrangement = internal.schematic_properties?.port_arrangement
  //   const schematic_component: SchematicComponent = {
  //     type: "schematic_component",
  //     source_component_id,
  //     schematic_component_id,
  //     rotation: internal.schematic_rotation ?? 0,
  //     size:
  //       ftype === "simple_capacitor"
  //         ? { width: 3 / 4, height: 3 / 4 }
  //         : ftype === "simple_resistor"
  //         ? {
  //             width: 1,
  //             height: 12 / 40,
  //           }
  //         : ftype === "simple_bug"
  //         ? {
  //             width:
  //               Math.max(
  //                 port_arrangement.top_size ?? 0,
  //                 port_arrangement.bottom_size ?? 0,
  //                 1
  //               ) + 0.5,
  //             height: Math.max(
  //               (port_arrangement.left_size ?? 0) / 2,
  //               (port_arrangement.right_size ?? 0) / 2,
  //               1
  //             ),
  //           }
  //         : ftype === "simple_ground"
  //         ? {
  //             width: 0.5,
  //             height: (0.5 * 15) / 18,
  //           }
  //         : ftype === "simple_power_source"
  //         ? { width: (1 * 24) / 34, height: 1 }
  //         : { width: 1, height: 1 },
  //     center: internal.schematic_position || { x: 0, y: 0 },
  //     ...internal.schematic_properties,
  //   }
  //   elements.push(schematic_component)

  //   builder.ports.setSchematicComponent(schematic_component_id)
  //   builder.ports.setSourceComponent(source_component_id)

  //   const textElements = []

  //   // Ports can usually be determined via the ftype and dimensions
  //   switch (source_component.ftype) {
  //     case "simple_capacitor": {
  //       builder.ports.add("left", { x: -0.5, y: 0 })
  //       builder.ports.add("right", { x: 0.5, y: 0 })
  //       textElements.push({
  //         type: "schematic_text",
  //         text: source_component.name,
  //         schematic_text_id: project_builder.getId("schematic_text"),
  //         schematic_component_id,
  //         anchor: "left",
  //         position: { x: -0.5, y: -0.3 },
  //       })
  //       textElements.push({
  //         type: "schematic_text",
  //         text: source_component.capacitance,
  //         schematic_text_id: project_builder.getId("schematic_text"),
  //         schematic_component_id,
  //         anchor: "left",
  //         position: { x: -0.3, y: -0.3 },
  //       })
  //       break
  //     }
  //     case "simple_resistor": {
  //       builder.ports.add("left", { x: -0.5, y: 0 })
  //       builder.ports.add("right", { x: 0.5, y: 0 })
  //       const [text_pos1, text_pos2] =
  //         schematic_component.rotation === Math.PI / 2 ||
  //         schematic_component.rotation === -Math.PI / 2
  //           ? [
  //               { x: -0.2, y: -0.3 },
  //               { x: 0, y: -0.3 },
  //             ]
  //           : [
  //               { x: -0.2, y: -0.5 },
  //               { x: -0.2, y: -0.3 },
  //             ]

  //       textElements.push({
  //         type: "schematic_text",
  //         text: source_component.name,
  //         schematic_text_id: project_builder.getId("schematic_text"),
  //         schematic_component_id,
  //         anchor: "left",
  //         position: text_pos1,
  //       })
  //       textElements.push({
  //         type: "schematic_text",
  //         text: source_component.resistance,
  //         schematic_text_id: project_builder.getId("schematic_text"),
  //         schematic_component_id,
  //         anchor: "left",
  //         position: text_pos2,
  //       })
  //       break
  //     }
  //     case "simple_ground": {
  //       builder.ports.add("gnd", { x: 0, y: -0.2 })
  //       break
  //     }
  //     case "simple_power_source": {
  //       builder.ports.add("positive", { x: 0, y: -0.5 })
  //       builder.ports.add("negative", { x: 0, y: 0.5 })
  //       break
  //     }
  //     case "simple_bug": {
  //       // add ports based on port arangement and give appropriate labels
  //       const { port_labels, port_arrangement } = internal.schematic_properties
  //       for (
  //         let i = 0;
  //         i < port_arrangement.left_size + port_arrangement.right_size;
  //         i++
  //       ) {
  //         const portPosition = getPortPosition(port_arrangement, i)
  //         builder.ports.add(port_labels[i + 1], portPosition)
  //         const schematic_text_id =
  //           builder.project_builder.getId("schematic_text")
  //         const is_left = i < port_arrangement.left_size
  //         const portText: Type.SchematicText = {
  //           type: "schematic_text",
  //           schematic_text_id,
  //           schematic_component_id,
  //           text: port_labels[i + 1],
  //           anchor: is_left ? "left" : "right",
  //           position: {
  //             x: portPosition.x + (is_left ? 0.3 : -0.3),
  //             y: portPosition.y,
  //           },
  //         }
  //         textElements.push(portText)
  //       }
  //       break
  //     }
  //   }
  //   elements.push(
  //     ...transformSchematicElements(
  //       [...builder.ports.build(), ...textElements],
  //       compose(
  //         translate(schematic_component.center.x, schematic_component.center.y),
  //         rotate(schematic_component.rotation)
  //       )
  //     )
  //   )

  //   elements.push({
  //     type: "pcb_component",
  //     source_component_id,
  //     pcb_component_id,
  //   })
  //   return elements
  // }

  // return builder
}
