import {
  PCBComponent,
  PCBPort,
  PCBTrace,
  PCBGroup,
  SchematicGroup,
  SchematicPort,
  SchematicTrace,
  SourceComponent,
  SourceGroup,
  SourcePort,
  SourceTrace,
  AnyElement,
  Project,
  SchematicConfig,
  PCBConfig,
  SourceConfig,
  SchematicComponent,
} from "lib/types/index"
import {
  defaultPCBConfig,
  defaultSchematicConfig,
  defaultSourceConfig,
} from "./defaults"

export const createProjectFromElements = (objects: AnyElement[]): Project => {
  const project: Project = {
    type: "project",
    schematic_config:
      (objects.find((o) => o.type === "schematic_config") as SchematicConfig) ||
      defaultSchematicConfig,
    schematic_components: objects.filter(
      (o) => o.type === "schematic_component"
    ) as SchematicComponent[],
    schematic_groups: objects.filter(
      (o) => o.type === "schematic_group"
    ) as SchematicGroup[],
    schematic_traces: objects.filter(
      (o) => o.type === "schematic_trace"
    ) as SchematicTrace[],
    schematic_ports: objects.filter(
      (o) => o.type === "schematic_port"
    ) as SchematicPort[],
    pcb_config:
      (objects.find((o) => o.type === "pcb_config") as PCBConfig) ||
      defaultPCBConfig,
    pcb_groups: objects.filter((o) => o.type === "pcb_group") as PCBGroup[],
    pcb_components: objects.filter(
      (o) => o.type === "pcb_component"
    ) as PCBComponent[],
    pcb_traces: objects.filter((o) => o.type === "pcb_trace") as PCBTrace[],
    pcb_ports: objects.filter((o) => o.type === "pcb_port") as PCBPort[],
    source_config:
      (objects.find((o) => o.type === "source_config") as SourceConfig) ||
      defaultSourceConfig,
    source_traces: objects.filter(
      (o) => o.type === "source_trace"
    ) as SourceTrace[],
    source_groups: objects.filter(
      (o) => o.type === "source_group"
    ) as SourceGroup[],
    source_components: objects.filter(
      (o) => o.type === "source_component"
    ) as SourceComponent[],
    source_ports: objects.filter(
      (o) => o.type === "source_port"
    ) as SourcePort[],
  }
  return project
}
