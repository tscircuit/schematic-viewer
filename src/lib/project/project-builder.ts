import * as Type from "lib/types/index"
import { Except, Simplify } from "type-fest"

type ComponentBuilderCallback = (cb: ComponentBuilder) => unknown
interface ComponentBuilder {
  project_builder: ProjectBuilder
  elements: Type.AnyElement[]
  setName: (name: string) => ComponentBuilder
  setSourceProperties<T extends Type.SourceComponentFType>(
    ftype: T,
    properties: Simplify<
      Except<
        Extract<Type.SourceComponent, { ftype: T }>,
        "type" | "source_component_id" | "ftype"
      >
    >
  ): ComponentBuilder
}

type GroupBuilderCallback = (gb: GroupBuilder) => unknown
interface GroupBuilder {
  project_builder: ProjectBuilder
  elements: Type.AnyElement[]
  addGroup: (groupBuilderCallback: GroupBuilderCallback) => GroupBuilder
  addComponent: (
    componentBuilderCallback: ComponentBuilderCallback
  ) => ComponentBuilder
}

interface ProjectBuilder extends GroupBuilder {
  build: () => Type.Project
}

export const createProjectBuilder = (): ProjectBuilder => {
  return null as any
}

export const createGroupBuilder = (): GroupBuilder => {
  return null as any
}

export const createComponentBuilder = (): ComponentBuilder => {
  return null as any
}
