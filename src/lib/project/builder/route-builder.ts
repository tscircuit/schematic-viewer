import * as Type from "lib/types"
import { Except, Simplify } from "type-fest"
import { ProjectBuilder } from "./project-builder"

export type RouteBuilderCallback = (cb: RouteBuilder) => unknown
export interface RouteBuilder {
  project_builder: ProjectBuilder
  build(): Type.AnyElement[]
}

export const createRouteBuilder = (
  project_builder: ProjectBuilder
): RouteBuilder => {
  const builder: RouteBuilder = { project_builder } as any
  const internal: any = {}

  builder.build = () => {
    return []
  }

  return builder
}
