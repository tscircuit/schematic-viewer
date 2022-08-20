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

export interface BaseComponentBuilder<T> {
  project_builder: ProjectBuilder
  ports: PortsBuilder
  setName: (name: string) => BaseComponentBuilder<T>
  setTag: (tag: string) => BaseComponentBuilder<T>
  setTags: (tags: string[]) => BaseComponentBuilder<T>
  setSourceProperties(
    properties: Simplify<
      Except<
        Type.SourceComponent,
        "type" | "source_component_id" | "ftype" | "name"
      >
    > & { name?: string }
  ): BaseComponentBuilder<T>
  setSchematicCenter(x: number, y: number): BaseComponentBuilder<T>
  setSchematicRotation(
    rotation: number | `${number}deg`
  ): BaseComponentBuilder<T>
  setSchematicProperties(
    properties: Partial<Type.SchematicComponent>
  ): BaseComponentBuilder<T>
  labelPort(position: number, name: string): BaseComponentBuilder<T>
  build(): Type.AnyElement[]
}

export type GenericComponentBuilder =
  BaseComponentBuilder<GenericComponentBuilder> & {
    setFType: (ftype: string) => GenericComponentBuilder
  }
export type GenericComponentBuilderCallback = (
  cb: GenericComponentBuilder
) => unknown

export class ComponentBuilderClass implements GenericComponentBuilder {
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

  setFType(ftype: string) {
    this.source_properties.ftype = ftype
    return this
  }

  setSourceProperties(props) {
    this.source_properties = {
      ...this.source_properties,
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
): GenericComponentBuilder => {
  return new ComponentBuilderClass(project_builder)
}
