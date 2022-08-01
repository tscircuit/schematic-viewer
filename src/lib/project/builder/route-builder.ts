// TODO rename this to trace-builder

import * as Type from "lib/types"
import { Except, Simplify } from "type-fest"
import { ProjectBuilder, GroupBuilder } from "./"
import { ProjectClass, createProjectFromElements } from "lib/project"
import { applySelector } from "lib/apply-selector"

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

  builder.build = (parentElements: Type.AnyElement[] = []) => {
    // const elements = lastBuild
    // const source_ports = .filter(
    //   (elm) => elm.type === "source_port"
    // ) as Type.SourcePort[]
    // const project = new ProjectClass(createProjectFromElements(elements))
    for (const portSelector of portSelectors) {
      const port = applySelector(parentElements, selector)?.[0]
    }

    return []
  }

  return builder
}
