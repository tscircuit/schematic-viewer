import { useState } from "react"
import { SchematicViewer } from "./SchematicViewer"
import type { ManualEditEvent } from "@tscircuit/props"
import type { CircuitJson } from "circuit-json"

export const ControlledSchematicViewer = ({
  circuitJson,
  containerStyle,
  debugGrid = false,
  editingEnabled = false,
  debug = false,
}: {
  circuitJson: CircuitJson
  containerStyle?: React.CSSProperties
  debugGrid?: boolean
  editingEnabled?: boolean
  debug?: boolean
}) => {
  const [editEvents, setEditEvents] = useState<ManualEditEvent[]>([])

  return (
    <SchematicViewer
      circuitJson={circuitJson}
      editEvents={editEvents}
      onEditEvent={(event) => setEditEvents([...editEvents, event])}
      containerStyle={containerStyle}
      debugGrid={debugGrid}
      editingEnabled={editingEnabled}
      debug={debug}
    />
  )
}