import { useCallback, useEffect, useState } from "react"
import { ControlledSchematicViewer } from "lib/components/ControlledSchematicViewer"
import { renderToCircuitJson } from "lib/dev/render-to-circuit-json"
import type { ManualEditEvent } from "lib/types/edit-events"
import { SchematicViewer } from "lib/index"
import type { CircuitJson } from "circuit-json"

export default () => {
  const [editEvents, setEditEvents] = useState<ManualEditEvent[]>([])
  const [circuitJson, setCircuitJson] = useState<CircuitJson | null>(null)

  const rerenderCircuitJson = useCallback(() => {
    setCircuitJson(
      renderToCircuitJson(
        <board width="10mm" height="10mm">
          <resistor name="R1" resistance={1000} schX={Math.random() * 8 - 4} />
          <capacitor
            name="C1"
            capacitance="1uF"
            schX={Math.random() * 8 - 4}
            schY={Math.random() * 8 - 4}
          />
          <capacitor
            name="C2"
            schRotation={90}
            capacitance="1uF"
            schX={Math.random() * 8 - 4}
            schY={Math.random() * 8 - 4}
          />
          <trace from=".R1 .pin2" to=".C1 .pin1" />
          <trace from=".C1 .pin2" to=".C2 .pin1" />
        </board>,
      ) as any,
    )
  }, [])

  useEffect(() => {
    rerenderCircuitJson()
  }, [])

  return (
    <div style={{ position: "relative", height: "100%" }}>
      <button
        type="button"
        onClick={rerenderCircuitJson}
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
        Rerender Circuit JSON
      </button>
      <button
        type="button"
        onClick={() => setEditEvents([])}
        style={{
          position: "absolute",
          top: "16px",
          right: "220px",
          zIndex: 1001,
          backgroundColor: "#2196f3",
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
      <pre
        style={{
          position: "absolute",
          top: "64px",
          right: "64px",
          zIndex: 1001,
          backgroundColor: "#fff",
          padding: "12px",
          borderRadius: "4px",
          border: "1px solid #ccc",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          maxHeight: "300px",
          overflowY: "auto",
          fontSize: "12px",
          fontFamily: "monospace",
        }}
      >
        {JSON.stringify(editEvents, null, 2)}
      </pre>
      <SchematicViewer
        editEvents={editEvents}
        onEditEvent={(event) => setEditEvents([...editEvents, event])}
        circuitJson={circuitJson ?? []}
        containerStyle={{ height: "100%" }}
        debugGrid
        editingEnabled
      />
    </div>
  )
}
