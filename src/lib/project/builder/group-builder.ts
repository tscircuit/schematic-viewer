import * as Type from "lib/types"
import {
  ComponentBuilder,
  ComponentBuilderCallback,
  createComponentBuilder,
} from "./component-builder"
import { ProjectBuilder } from "./project-builder"
import {
  createRouteBuilder,
  RouteBuilder,
  RouteBuilderCallback,
} from "./route-builder"

export type GroupBuilderCallback = (gb: GroupBuilder) => unknown
export interface GroupBuilder {
  project_builder: ProjectBuilder
  addGroup: (groupBuilderCallback: GroupBuilderCallback) => GroupBuilder
  addComponent: (
    componentBuilderCallback: ComponentBuilderCallback
  ) => GroupBuilder
  addRoute: (
    routeBuilderCallback: RouteBuilderCallback | string[]
  ) => GroupBuilder
  build(): Type.AnyElement[]
}

export const createGroupBuilder = (
  project_builder?: ProjectBuilder
): GroupBuilder => {
  const builder: GroupBuilder = {
    project_builder,
  } as any
  const internal = {
    groups: [] as GroupBuilder[],
    components: [] as ComponentBuilder[],
    routes: [] as RouteBuilder[],
  }

  builder.addGroup = (callback) => {
    const gb = createGroupBuilder()
    gb.project_builder = builder.project_builder
    internal.groups.push(gb)
    callback(gb)
    return builder
  }
  builder.addComponent = (callback) => {
    const cb = createComponentBuilder(builder.project_builder)
    internal.components.push(cb)
    callback(cb)
    return builder
  }
  builder.addRoute = (callback) => {
    if (typeof callback !== "function") {
      const portSelectors = callback as string[]
      callback = (rb) => {
        rb.addConnections(portSelectors)
      }
    }
    const rb = createRouteBuilder(builder.project_builder)
    internal.routes.push(rb)
    callback(rb)
    return builder
  }

  builder.build = () => {
    const elements = []
    elements.push(...internal.groups.flatMap((g) => g.build()))
    elements.push(...internal.components.flatMap((c) => c.build()))
    elements.push(...internal.routes.flatMap((c) => c.build(elements)))
    return elements
  }

  return builder
}
