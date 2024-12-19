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
  const [editEvents, setEditEvents] = useState<ManualEditEvent[]>([])

  return (
    <SchematicViewer
      circuitJson={circuitJson}
      editEvents={editEvents}
      onEditEvent={(event) => setEditEvents([...editEvents, event])}
      containerStyle={containerStyle}
    />
  )
}
