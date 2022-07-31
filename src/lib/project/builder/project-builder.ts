import * as Type from "lib/types"
import { Except, Simplify } from "type-fest"
import { createGroupBuilder, GroupBuilderCallback } from "./group-builder"
import { ComponentBuilderCallback } from "./component-builder"
import { createProjectFromElements } from "../create-project-from-elements"
import { RouteBuilderCallback } from "./route-builder"

export interface ProjectBuilder {
  getId: (prefix: string) => string
  addGroup: (groupBuilderCallback: GroupBuilderCallback) => ProjectBuilder
  addComponent: (
    componentBuilderCallback: ComponentBuilderCallback
  ) => ProjectBuilder
  addRoute: (routeBuilderCallback: RouteBuilderCallback) => ProjectBuilder
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
