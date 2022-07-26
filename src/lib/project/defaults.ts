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

export const defaultSchematicConfig: SchematicConfig = {
  type: "schematic_config",
}

export const defaultPCBConfig: PCBConfig = {
  type: "pcb_config",
  dimension_unit: "mm",
}

export const defaultSourceConfig: SourceConfig = {
  type: "source_config",
}
