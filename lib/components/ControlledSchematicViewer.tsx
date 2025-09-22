import { useState } from "react"
import { SchematicViewer } from "./SchematicViewer"
import type { ManualEditEvent } from "@tscircuit/props"

export const ControlledSchematicViewer = ({
  circuitJson,
  containerStyle,
  debugGrid = false,
  editingEnabled = false,
  debug = false,
  clickToInteractEnabled = false,
  onClickComponent,
}: {
  circuitJson: any[]
  containerStyle?: React.CSSProperties
  debugGrid?: boolean
  editingEnabled?: boolean
  debug?: boolean
  clickToInteractEnabled?: boolean
  onClickComponent?: (componentId: string) => void
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
      clickToInteractEnabled={clickToInteractEnabled}
      onClickComponent={onClickComponent}
    />
  )
}
