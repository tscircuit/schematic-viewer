import { SourceComponent } from "./source-component"

export interface SchematicConfig {
  type: "schematic_config"
}

export interface Point {
  x: number
  y: number
}

export interface Size {
  width: number
  height: number
}

export interface SourceConfig {
  type: "source_config"
}

export interface SchematicGroup {
  type: "schematic_group"
  schematic_group_id: string
  source_group_id: string
  center: Point
  size: Size
  children_schematic_component_ids: string[]
  children_schematic_trace_ids: string[]
}

export interface SchematicComponent {
  type: "schematic_component"
  rotation: number
  size: Size
  center: Point
  source_component_id: string
  schematic_component_id: string

  // TODO only for schematic-bug
  port_arrangement?: {
    left_size: number
    right_size: number
    top_size?: number
    bottom_size?: number
  }
  port_labels?: {
    [port_number: string]: string
  }
}

export interface SchematicBox {
  type: "schematic_box"
  drawing_type: "box"
  schematic_box_id: string
  schematic_component_id: string
  x: number
  y: number
  width: number
  height: number
}

export interface SchematicLine {
  type: "schematic_line"
  drawing_type: "line"
  schematic_component_id: string
  x1: number
  y1: number
  x2: number
  y2: number
}

export interface SchematicPath {
  type: "schematic_path"
  drawing_type: "path"
  schematic_component_id: string
  points: Array<{
    x: number
    y: number
  }>
  is_filled: boolean
}

export interface SchematicTrace {
  type: "schematic_trace"
  schematic_trace_id: string
  source_trace_id: string
  edges: Array<{
    from: { x: number; y: number }
    to: { x: number; y: number }
    from_schematic_port_id?: string
    to_schematic_port_id?: string
  }>
}

export interface SchematicText {
  type: "schematic_text"
  schematic_component_id: string
  schematic_text_id: string
  text: string
  position: Point
  anchor: "center" | "left" | "right" | "top" | "bottom"
}

export interface SchematicPort {
  type: "schematic_port"
  schematic_port_id: string
  source_port_id: string
  center: Point
  facing_direction?: "up" | "down" | "left" | "right"
}

export interface PCBTrace {
  type: "pcb_trace"
  source_trace_id: string
  pcb_trace_id: string
  route: Array<{
    x: number
    y: number
    strokeWidth: number
    cap: "butt" | "round" | "square"
    start_pcb_port_id?: string
    end_pcb_port_id?: string
  }>
}

export interface PCBComponent {
  type: "pcb_component"
  pcb_component_id: string
  source_component_id: string
}

export interface PCBPort {
  type: "pcb_port"
  pcb_port_id: string
  source_port_id: string
}

export interface PCBGroup {
  type: "pcb_group"
  source_group_id: string
}

export interface PCBConfig {
  type: "pcb_config"
  dimension_unit: "mm"
}

export interface SourceTrace {
  type: "source_trace"
  source_trace_id: string
  connected_source_port_ids: string[]
}

export interface SourceGroup {
  type: "source_group"
  source_group_id: string
  name: string
  children_source_component_ids: string[]
}

export interface SourcePort {
  type: "source_port"
  name: string
  source_port_id: string
  source_component_id: string
}

export interface Project {
  type: "project"
  schematic_config: SchematicConfig
  schematic_components: SchematicComponent[]
  schematic_groups: SchematicGroup[]
  schematic_traces: SchematicTrace[]
  schematic_texts: SchematicText[]
  schematic_ports: SchematicPort[]
  pcb_config: PCBConfig
  pcb_groups: PCBGroup[]
  pcb_components: PCBComponent[]
  pcb_traces: PCBTrace[]
  pcb_ports: PCBPort[]
  source_config: SourceConfig
  source_traces: SourceTrace[]
  source_groups: SourceGroup[]
  source_components: SourceComponent[]
  source_ports: SourcePort[]
}

export type AnyElement =
  | Project
  | SourceConfig
  | SourceComponent
  | SourceGroup
  | SourceTrace
  | SourcePort
  | PCBTrace
  | PCBComponent
  | PCBGroup
  | PCBConfig
  | PCBPort
  | SchematicGroup
  | SchematicComponent
  | SchematicTrace
  | SchematicConfig
  | SchematicPort
  | SchematicText
  | SchematicLine
  | SchematicPath

export type ElementType = AnyElement["type"]
export type ElementOfType<T extends ElementType> = Extract<
  AnyElement,
  { type: T }
>
