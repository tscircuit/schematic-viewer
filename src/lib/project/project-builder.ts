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
  setSchematicCenter(x: number, y: number): ComponentBuilder
  setSchematicRotation(rotation: number | `${number}deg`): ComponentBuilder
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
  const builder: ComponentBuilder = { project_builder } as any
  const internal: any = {}

  builder.setName = (name: string) => {
    internal.name = name
    return builder
  }
  builder.setSourceProperties = (ftype: string, props: any) => {
    internal.source_properties = {
      ftype,
      ...props,
    }
    return builder
  }
  builder.setSchematicCenter = (x: number, y: number) => {
    internal.schematic_position = { x, y }
    return builder
  }
  builder.setSchematicRotation = (rotation) => {
    if (typeof rotation === "number") {
      internal.schematic_rotation = rotation
    } else {
      internal.schematic_rotation =
        (parseFloat(rotation.split("deg")[0]) / 180) * Math.PI
    }
    return builder
  }

  builder.build = () => {
    const elements: Type.AnyElement[] = []
    const { ftype } = internal.source_properties
    const source_component_id = project_builder.getId(ftype)
    elements.push({
      type: "source_component",
      source_component_id,
      name: internal.name,
      ...internal.source_properties,
    })
    elements.push({
      type: "schematic_component",
      source_component_id,
      schematic_component_id: project_builder.getId(`sch_${ftype}`),
      rotation: internal.schematic_rotation ?? 0,
      size:
        ftype === "simple_capacitor"
          ? { width: 3 / 4, height: 3 / 4 }
          : ftype === "simple_resistor"
          ? {
              width: 1,
              height: 12 / 40,
            }
          : { width: 1, height: 1 },
      center: internal.schematic_position || { x: 0, y: 0 },
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
