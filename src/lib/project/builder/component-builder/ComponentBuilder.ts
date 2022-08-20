import * as Type from "lib/types"
import { Except, Simplify } from "type-fest"
import { ProjectBuilder } from "lib/project/builder/project-builder"
import { PortsBuilder } from "lib/project/builder/ports-builder"

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
  setSchematicProperties(
    properties: Partial<Type.SchematicComponent>
  ): ComponentBuilder
  labelPort(position: number, name: string): ComponentBuilder
  build(): Type.AnyElement[]
}
