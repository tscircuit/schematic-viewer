import type {
  BaseManualEditEvent,
  EditSchematicComponentLocationEvent,
  ManualEditEvent,
} from "@tscircuit/props"

export type EditSchematicComponentLocationEventWithElement =
  EditSchematicComponentLocationEvent & {
    _element: SVGElement
  }

export interface EditSchematicWireAddEvent extends BaseManualEditEvent {
  edit_event_type: "edit_schematic_wire_add"
  from_schematic_port_id: string
  to_schematic_port_id: string
  route: Array<{ x: number; y: number }>
}

export interface EditSchematicBusAddEvent extends BaseManualEditEvent {
  edit_event_type: "edit_schematic_bus_add"
  route: Array<{ x: number; y: number }>
}

export interface EditSchematicBusEntryAddEvent extends BaseManualEditEvent {
  edit_event_type: "edit_schematic_bus_entry_add"
  anchor: { x: number; y: number }
}

export interface EditSchematicNoConnectAddEvent extends BaseManualEditEvent {
  edit_event_type: "edit_schematic_no_connect_add"
  center: { x: number; y: number }
  schematic_port_id?: string
}

export interface EditSchematicNetLabelAddEvent extends BaseManualEditEvent {
  edit_event_type: "edit_schematic_net_label_add"
  position: { x: number; y: number }
  net_name: string
  schematic_port_id?: string
  anchor_side?: "left" | "right" | "top" | "bottom"
}

export interface EditSchematicGlobalLabelAddEvent extends BaseManualEditEvent {
  edit_event_type: "edit_schematic_global_label_add"
  position: { x: number; y: number }
  net_name: string
  schematic_port_id?: string
  anchor_side?: "left" | "right" | "top" | "bottom"
}

export interface EditSchematicPowerPortAddEvent extends BaseManualEditEvent {
  edit_event_type: "edit_schematic_power_port_add"
  position: { x: number; y: number }
  net_name: string
  schematic_port_id?: string
  anchor_side?: "left" | "right" | "top" | "bottom"
}

export interface EditSchematicGroundPortAddEvent extends BaseManualEditEvent {
  edit_event_type: "edit_schematic_ground_port_add"
  position: { x: number; y: number }
  net_name: string
  schematic_port_id?: string
  anchor_side?: "left" | "right" | "top" | "bottom"
}

export interface EditSchematicTextNoteAddEvent extends BaseManualEditEvent {
  edit_event_type: "edit_schematic_text_note_add"
  position: { x: number; y: number }
  text: string
  anchor?: "left" | "right" | "center"
  font_size?: number
  color?: string
}

export interface EditSchematicHierSheetAddEvent extends BaseManualEditEvent {
  edit_event_type: "edit_schematic_hier_sheet_add"
  box: { x: number; y: number; width: number; height: number }
  sheet_name: string
  target_sheet_id: string
  sheet_name_pos: { x: number; y: number }
  file_name_pos: { x: number; y: number }
}

export type PlacementComponentKind = "resistor" | "capacitor" | "inductor"

export interface EditSchematicComponentAddEvent extends BaseManualEditEvent {
  edit_event_type: "edit_schematic_component_add"
  position: { x: number; y: number }
  component_kind: PlacementComponentKind
  rotation?: number
}

export type ExtendedManualEditEvent =
  | ManualEditEvent
  | EditSchematicWireAddEvent
  | EditSchematicBusAddEvent
  | EditSchematicBusEntryAddEvent
  | EditSchematicNoConnectAddEvent
  | EditSchematicNetLabelAddEvent
  | EditSchematicGlobalLabelAddEvent
  | EditSchematicHierSheetAddEvent
  | EditSchematicPowerPortAddEvent
  | EditSchematicGroundPortAddEvent
  | EditSchematicTextNoteAddEvent
  | EditSchematicComponentAddEvent

export type {
  BaseManualEditEvent,
  EditSchematicComponentLocationEvent,
  ManualEditEvent,
}
