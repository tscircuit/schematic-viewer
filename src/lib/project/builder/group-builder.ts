import * as Type from "lib/types"
import * as CB from "./component-builder"
import { ProjectBuilder } from "./project-builder"
import {
  createTraceBuilder,
  convertToReadableTraceTree,
  TraceBuilder,
  TraceBuilderCallback,
} from "./trace-builder"

export type GroupBuilderCallback = (gb: GroupBuilder) => unknown
export interface GroupBuilder {
  project_builder: ProjectBuilder
  addGroup: (groupBuilderCallback: GroupBuilderCallback) => GroupBuilder
  addComponent: (
    componentBuilderCallback: CB.GenericComponentBuilderCallback
  ) => GroupBuilder
  addResistor: (
    resistorBuilderCallback: CB.ResistorBuilderCallback
  ) => GroupBuilder
  addCapacitor: (
    capacitorBuilderCallback: CB.CapacitorBuilderCallback
  ) => GroupBuilder
  addDiode: (capacitorBuilderCallback: CB.DiodeBuilderCallback) => GroupBuilder
  addBug: (bugBuilderCallback: CB.BugBuilderCallback) => GroupBuilder
  addPowerSource: (
    powerSourceBuilderCallback: CB.PowerSourceBuilderCallback
  ) => GroupBuilder
  addInductor: (
    powerSourceBuilderCallback: CB.InductorBuilderCallback
  ) => GroupBuilder
  addGround: (groundBuilderCallback: CB.GroundBuilderCallback) => GroupBuilder
  addTrace: (
    traceBuiderCallback: TraceBuilderCallback | string[]
  ) => GroupBuilder
  build(): Promise<Type.AnyElement[]>
}

export const createGroupBuilder = (
  project_builder?: ProjectBuilder
): GroupBuilder => {
  const builder: GroupBuilder = {
    project_builder,
  } as any
  const internal = {
    groups: [] as GroupBuilder[],
    components: [] as CB.BaseComponentBuilder<any>[],
    traces: [] as TraceBuilder[],
  }

  builder.addGroup = (callback) => {
    const gb = createGroupBuilder()
    gb.project_builder = builder.project_builder
    internal.groups.push(gb)
    callback(gb)
    return builder
  }

  builder.addComponent = (callback) => {
    const cb = CB.createComponentBuilder(builder.project_builder)
    internal.components.push(cb)
    callback(cb)
    return builder
  }
  builder.addResistor = (callback) => {
    const cb = CB.createResistorBuilder(builder.project_builder)
    internal.components.push(cb)
    callback(cb)
    return builder
  }
  builder.addCapacitor = (callback) => {
    const cb = CB.createCapacitorBuilder(builder.project_builder)
    internal.components.push(cb)
    callback(cb)
    return builder
  }
  builder.addInductor = (callback) => {
    const cb = CB.createInductorBuilder(builder.project_builder)
    internal.components.push(cb)
    callback(cb)
    return builder
  }
  builder.addBug = (callback) => {
    const cb = CB.createBugBuilder(builder.project_builder)
    internal.components.push(cb)
    callback(cb)
    return builder
  }
  builder.addGround = (callback) => {
    const cb = CB.createGroundBuilder(builder.project_builder)
    internal.components.push(cb)
    callback(cb)
    return builder
  }
  builder.addPowerSource = (callback) => {
    const cb = CB.createPowerSourceBuilder(builder.project_builder)
    internal.components.push(cb)
    callback(cb)
    return builder
  }
  builder.addDiode = (callback) => {
    const cb = CB.createDiodeBuilder(builder.project_builder)
    internal.components.push(cb)
    callback(cb)
    return builder
  }

  builder.addTrace = (callback) => {
    if (typeof callback !== "function") {
      const portSelectors = callback as string[]
      callback = (rb) => {
        rb.addConnections(portSelectors)
      }
    }
    const rb = createTraceBuilder(builder.project_builder)
    internal.traces.push(rb)
    callback(rb)
    return builder
  }

  builder.build = async () => {
    const elements = []
    elements.push(...(await Promise.all(internal.groups.map((g) => g.build()))))
    elements.push(
      ...(await Promise.all(internal.components.map((c) => c.build())))
    )
    elements.push(
      ...(await Promise.all(internal.traces.map((c) => c.build(elements))))
    )
    return elements
  }

  return builder
}
