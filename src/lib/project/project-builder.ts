import { createProjectFromElements } from "./create-project-from-elements"
import { Project } from "./../types/core"
import * as Type from "lib/types/index"
import { Except, Simplify } from "type-fest"

type ComponentBuilderCallback = (cb: ComponentBuilder) => unknown
interface ComponentBuilder {
  project_builder: ProjectBuilder
  setName: (name: string) => ComponentBuilder
  setSourceProperties<T extends Type.SourceComponentFType>(
    ftype: T,
    properties: Simplify<
      Except<
        Extract<Type.SourceComponent, { ftype: T }>,
        "type" | "source_component_id" | "ftype" | "name"
      >
    > & { name?: string }
  ): ComponentBuilder
  build(): Type.AnyElement[]
}

type GroupBuilderCallback = (gb: GroupBuilder) => unknown
interface GroupBuilder {
  project_builder: ProjectBuilder
  addGroup: (groupBuilderCallback: GroupBuilderCallback) => GroupBuilder
  addComponent: (
    componentBuilderCallback: ComponentBuilderCallback
  ) => GroupBuilder
  build(): Type.AnyElement[]
}

interface ProjectBuilder {
  getId: (prefix: string) => string
  addGroup: (groupBuilderCallback: GroupBuilderCallback) => ProjectBuilder
  addComponent: (
    componentBuilderCallback: ComponentBuilderCallback
  ) => ProjectBuilder
  build: () => Type.Project
}

export const createProjectBuilder = (): ProjectBuilder => {
  const builder: any = createGroupBuilder()
  builder.project_builder = builder
  const idCount = {}
  builder.getId = (prefix: string) => {
    idCount[prefix] = idCount[prefix] || 0
    return `${prefix}_${idCount[prefix]++}`
  }
  builder.build_group = builder.build
  builder.build = () => {
    console.log({
      build_group_output: builder.build_group(),
    })
    return createProjectFromElements(builder.build_group())
  }
  return builder
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

export const createComponentBuilder = (
  project_builder: ProjectBuilder
): ComponentBuilder => {
  const builder: any = { project_builder }

  builder.setName = (name: string) => {
    builder.name = name
  }
  builder.setSourceProperties = (ftype: string, props: any) => {
    builder.source_properties = {
      ftype,
      ...props,
    }
  }

  builder.build = () => {
    const elements: Type.AnyElement[] = []
    const { ftype } = builder.source_properties
    const source_component_id = project_builder.getId(ftype)
    elements.push({
      type: "source_component",
      source_component_id,
      name: builder.name,
      ...builder.source_properties,
    })
    elements.push({
      type: "schematic_component",
      source_component_id,
      schematic_component_id: project_builder.getId(`sch_${ftype}`),
      rotation: 0,
      size: { width: 0.1, height: 0.1 },
      bounds: {
        left: 0,
        right: 0.1,
        top: 0.1,
        bottom: 0,
      },
    })
    elements.push({
      type: "pcb_component",
      source_component_id,
      pcb_component_id: project_builder.getId(`pcb_${ftype}`),
    })
    return elements
  }

  return builder
}
