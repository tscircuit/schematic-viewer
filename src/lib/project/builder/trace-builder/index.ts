// TODO rename this to trace-builder

import * as Type from "lib/types"
import { Except, Simplify } from "type-fest"
import { ProjectBuilder, GroupBuilder } from ".."
import { ProjectClass, createProjectFromElements } from "lib/project"
import { applySelector } from "lib/apply-selector"
export { convertToReadableTraceTree } from "./convert-to-readable-route-tree"
import { straightRouteSolver } from "./straight-route-solver"
import { rmstSolver } from "./rmst-solver"

export type TraceBuilderCallback = (cb: TraceBuilder) => unknown
export interface TraceBuilder {
  project_builder: ProjectBuilder
  parent: GroupBuilder
  setRouteSolver: (routeSolver: Type.RouteSolver) => TraceBuilder
  addConnections: (portSelectors: Array<string>) => TraceBuilder
  build(elements: Type.AnyElement[]): Promise<Type.AnyElement[]>
}

export const createTraceBuilder = (
  project_builder: ProjectBuilder
): TraceBuilder => {
  const builder: TraceBuilder = { project_builder } as any
  const internal: any = {
    portSelectors: [] as string[],
    routeSolver: rmstSolver,
  }

  builder.addConnections = (portSelectors) => {
    internal.portSelectors.push(...portSelectors)
    return builder
  }

  builder.setRouteSolver = (
    routeSolver: Type.RouteSolver | "rmst" | "straight"
  ) => {
    if (typeof routeSolver === "string") {
      internal.routeSolver =
        routeSolver === "straight" ? straightRouteSolver : rmstSolver
    }
    internal.routeSolver = routeSolver
    return builder
  }

  builder.build = async (parentElements: Type.AnyElement[] = []) => {
    const sourcePortsInRoute: Type.SourcePort[] = []
    for (const portSelector of internal.portSelectors) {
      const selectedElms = applySelector(parentElements, portSelector)
      if (selectedElms.length === 0) {
        throw new Error(`No elements found for selector: ${portSelector}`)
      }
      for (const selectedElm of selectedElms) {
        if (selectedElm.type !== "source_port")
          throw new Error(
            `non-source_port "${JSON.stringify(
              selectedElm,
              null,
              "  "
            )}" selected by selector "${portSelector}" `
          )
        sourcePortsInRoute.push(selectedElm)
      }
    }

    const source_trace_id = builder.project_builder.getId("source_trace")
    const source_trace: Type.SourceTrace = {
      type: "source_trace",
      source_trace_id,
      connected_source_port_ids: sourcePortsInRoute.map(
        (sp) => sp.source_port_id
      ),
    }
    const schematic_trace_id = builder.project_builder.getId("schematic_trace")

    const straightRoute = sourcePortsInRoute.map((sp) => {
      const schematic_port = parentElements.find(
        (elm) =>
          elm.type === "schematic_port" &&
          elm.source_port_id === sp.source_port_id
      ) as Type.SchematicPort | null
      if (!schematic_port)
        throw new Error(
          `Missing schematic_port for source_port "${sp.source_port_id}"`
        )
      return {
        x: schematic_port.center.x,
        y: schematic_port.center.y,
        schematic_port_id: schematic_port.schematic_port_id,
        facing_direction: schematic_port.facing_direction,
      }
    })

    const edges = await internal.routeSolver({
      terminals: straightRoute,
      obstacles: [],
    })

    const schematic_trace: Type.SchematicTrace = {
      type: "schematic_trace",
      source_trace_id: source_trace_id,
      schematic_trace_id,
      edges,
    }

    return [source_trace, schematic_trace]
  }

  return builder
}
