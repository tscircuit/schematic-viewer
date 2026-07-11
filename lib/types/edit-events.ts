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

export type ExtendedManualEditEvent =
  | ManualEditEvent
  | EditSchematicWireAddEvent
  | EditSchematicBusAddEvent
  | EditSchematicBusEntryAddEvent
  | EditSchematicNoConnectAddEvent
  | EditSchematicNetLabelAddEvent

export type {
  BaseManualEditEvent,
  EditSchematicComponentLocationEvent,
  ManualEditEvent,
}
