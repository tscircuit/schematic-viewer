import * as Type from "lib/types"
import {
  ComponentBuilder,
  ComponentBuilderCallback,
  createComponentBuilder,
} from "./component-builder"
import { ProjectBuilder } from "./project-builder"
import { Except, Simplify } from "type-fest"

export type GroupBuilderCallback = (gb: GroupBuilder) => unknown
export interface GroupBuilder {
  project_builder: ProjectBuilder
  addGroup: (groupBuilderCallback: GroupBuilderCallback) => GroupBuilder
  addComponent: (
    componentBuilderCallback: ComponentBuilderCallback
  ) => GroupBuilder
  build(): Type.AnyElement[]
}

export const createGroupBuilder = (
  project_builder?: ProjectBuilder
): GroupBuilder => {
  const builder: any = {
    project_builder,
    groups: [],
    components: [],
    routes: [],
  }

  builder.addGroup = (callback) => {
    const gb = createGroupBuilder()
    gb.project_builder = builder.project_builder
    builder.groups.push(gb)
    callback(gb)
    return builder
  }
  builder.addComponent = (callback) => {
    const cb = createComponentBuilder(builder.project_builder)
    cb.project_builder = builder.project_builder
    builder.components.push(cb)
    callback(cb)
    return builder
  }

  builder.build = () => {
    const elements = []
    elements.push(...builder.groups.flatMap((g) => g.build()))
    elements.push(...builder.components.flatMap((c) => c.build()))
    elements.push(...builder.routes.flatMap((c) => c.build()))
    return elements
  }

  return builder
}
