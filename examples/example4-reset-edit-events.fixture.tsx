import { useState } from "react"
import { ControlledSchematicViewer } from "lib/components/ControlledSchematicViewer"
import { renderToCircuitJson } from "lib/dev/render-to-circuit-json"
import type { ManualEditEvent } from "lib/types/edit-events"
import { SchematicViewer } from "lib/index"

export default () => {
  const [editEvents, setEditEvents] = useState<ManualEditEvent[]>([])

  return (
    <div style={{ position: "relative", height: "100%" }}>
      <button
        type="button"
        onClick={() => setEditEvents([])}
        style={{
          position: "absolute",
          top: "16px",
          right: "64px",
          zIndex: 1001,
          backgroundColor: "#f44336",
          color: "#fff",
          padding: "8px",
          borderRadius: "4px",
          cursor: "pointer",
          border: "none",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        }}
      >
        Reset Edits
      </button>
      <SchematicViewer
        editEvents={editEvents}
        onEditEvent={(event) => setEditEvents([...editEvents, event])}
        circuitJson={
          renderToCircuitJson(
            <board width="10mm" height="10mm">
              <resistor name="R1" resistance={1000} schX={-2} />
              <capacitor name="C1" capacitance="1uF" schX={2} schY={2} />
              <capacitor
                name="C2"
                schRotation={90}
                capacitance="1uF"
                schX={0}
                schY={-4}
              />
              <trace from=".R1 .pin2" to=".C1 .pin1" />
              <trace from=".C1 .pin2" to=".C2 .pin1" />
            </board>,
          ) as any
        }
        containerStyle={{ height: "100%" }}
        debugGrid
        editingEnabled
      />
    </div>
  )
}
