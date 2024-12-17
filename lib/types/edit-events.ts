export interface BaseManualEditEvent {
  edit_event_id: string
  in_progress?: boolean
  created_at: number
}

export interface EditSchematicComponentLocationEvent
  extends BaseManualEditEvent {
  edit_event_type: "edit_schematic_component_location"
  schematic_component_id: string
  original_center: { x: number; y: number }
  new_center: { x: number; y: number }
}

export type ManualEditEvent = EditSchematicComponentLocationEvent
