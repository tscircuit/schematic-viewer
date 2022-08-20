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

  build() {
    return []
  }
}

export const createGroundBuilder = (
  project_builder: ProjectBuilder
): GroundBuilder => {
  return new GroundBuilderClass(project_builder)
}
