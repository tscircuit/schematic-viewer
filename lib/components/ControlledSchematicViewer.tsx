import { useState } from "react"
import { SchematicViewer } from "./SchematicViewer"
import type { ManualEditEvent } from "@tscircuit/props"

export const ControlledSchematicViewer = ({
  circuitJson,
  containerStyle,
}: {
  circuitJson: Array<{ type: string }>
  containerStyle?: React.CSSProperties
}) => {
  const [editEvents, setEditEvents] = useState<ManualEditEvent[]>([
    {
      edit_event_id: "q1eqpf4oi",
      edit_event_type: "edit_schematic_component_location",
      schematic_component_id: "schematic_component_0",
      original_center: {
        x: 234.7581329345703,
        y: 474.44920349121094,
      },
      new_center: {
        x: 625,
        y: 209,
      },
      in_progress: false,
      created_at: 1734503344630,
    },
  ])

  console.log(editEvents)

  return (
    <SchematicViewer
      circuitJson={circuitJson}
      editEvents={editEvents}
      onEditEvent={(event) => setEditEvents([...editEvents, event])}
      containerStyle={containerStyle}
    />
  )
}
