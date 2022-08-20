import * as Type from "lib/types"
import {
  createGroupBuilder,
  GroupBuilder,
  GroupBuilderCallback,
} from "./group-builder"
import { GenericComponentBuilderCallback } from "./component-builder"
import { createProjectFromElements } from "../create-project-from-elements"
import { RouteBuilderCallback } from "./route-builder"

export interface ProjectBuilder extends GroupBuilder {
  getId: (prefix: string) => string
  addGroup: (groupBuilderCallback: GroupBuilderCallback) => ProjectBuilder
  buildProject: () => Type.Project
}

export const createProjectBuilder = (): ProjectBuilder => {
  const builder: any = createGroupBuilder()
  builder.project_builder = builder
  const idCount = {}
  const resetIdCount = () => Object.keys(idCount).map((k) => (idCount[k] = 0))
  builder.getId = (prefix: string) => {
    idCount[prefix] = idCount[prefix] || 0
    return `${prefix}_${idCount[prefix]++}`
  }
  builder.build_group = builder.build
  builder.buildProject = () => {
    resetIdCount()
    return createProjectFromElements(builder.build())
  }
  return builder
}
