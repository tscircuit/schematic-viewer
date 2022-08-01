import * as Type from "lib/types"
import { Except, Simplify } from "type-fest"
import { ProjectBuilder, GroupBuilder } from "./"
import parsel from "parsel"
import { ProjectClass, createProjectFromElements } from "lib/project"

export type RouteBuilderCallback = (cb: RouteBuilder) => unknown
export interface RouteBuilder {
  project_builder: ProjectBuilder
  parent: GroupBuilder
  addConnections: (portSelectors: Array<string>) => RouteBuilder
  build(): Type.AnyElement[]
}

export const createRouteBuilder = (
  project_builder: ProjectBuilder,
  parent: GroupBuilder
): RouteBuilder => {
  const builder: RouteBuilder = { project_builder, parent } as any
  const internal: any = {
    portSelectors: [] as string[],
  }

  builder.addConnections = (portSelectors) => {
    internal.portSelectors.push(...portSelectors)
    return builder
  }

  builder.build = () => {
    const elements = builder.parent.build()
    const source_ports = elements.filter(
      (elm) => elm.type === "source_port"
    ) as Type.SourcePort[]
    const project = new ProjectClass(createProjectFromElements(elements))

    applySelector(elements, selector)

    return []
  }

  return builder
}
