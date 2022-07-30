import {
  defaultPCBConfig,
  defaultSchematicConfig,
  defaultSourceConfig,
} from "./defaults"
import * as Type from "lib/types/index"

export const createProjectFromElements = (
  objects: Type.AnyElement[]
): Type.Project => {
  const project: Type.Project = {
    type: "project",
    schematic_config:
      (objects.find(
        (o) => o.type === "schematic_config"
      ) as Type.SchematicConfig) || defaultSchematicConfig,
    schematic_components: objects.filter(
      (o) => o.type === "schematic_component"
    ) as Type.SchematicComponent[],
    schematic_groups: objects.filter(
      (o) => o.type === "schematic_group"
    ) as Type.SchematicGroup[],
    schematic_traces: objects.filter(
      (o) => o.type === "schematic_trace"
    ) as Type.SchematicTrace[],
    schematic_ports: objects.filter(
      (o) => o.type === "schematic_port"
    ) as Type.SchematicPort[],
    pcb_config:
      (objects.find((o) => o.type === "pcb_config") as Type.PCBConfig) ||
      defaultPCBConfig,
    pcb_groups: objects.filter(
      (o) => o.type === "pcb_group"
    ) as Type.PCBGroup[],
    pcb_components: objects.filter(
      (o) => o.type === "pcb_component"
    ) as Type.PCBComponent[],
    pcb_traces: objects.filter(
      (o) => o.type === "pcb_trace"
    ) as Type.PCBTrace[],
    pcb_ports: objects.filter((o) => o.type === "pcb_port") as Type.PCBPort[],
    source_config:
      (objects.find((o) => o.type === "source_config") as Type.SourceConfig) ||
      defaultSourceConfig,
    source_traces: objects.filter(
      (o) => o.type === "source_trace"
    ) as Type.SourceTrace[],
    source_groups: objects.filter(
      (o) => o.type === "source_group"
    ) as Type.SourceGroup[],
    source_components: objects.filter(
      (o) => o.type === "source_component"
    ) as Type.SourceComponent[],
    source_ports: objects.filter(
      (o) => o.type === "source_port"
    ) as Type.SourcePort[],
  }
  return project
}
