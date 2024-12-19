# Drag and Drop Feature Specification

Drag'n'drop allows users to move schematic components inside the schematic
viewer.

It uses the "edit event architecture" to manage edits. Here's how it works:

- When the user starts dragging a component, there is an `activeEditEvent` that
  specifies the component to be moved
- When the user releases the mouse button, the `activeEditEvent` is committed
  via the `onEditEvent` callback
- The schematic viewer applies any edit events passed to it via the `editEvents`
  prop

## Types

The following is an excerpt from the types of the `@tscircuit/props` package,
which should be imported.

```tsx
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

export type ManualEditEvent =
  | EditPcbComponentLocationEvent
  | EditTraceHintEvent
  | EditSchematicComponentLocationEvent
```
