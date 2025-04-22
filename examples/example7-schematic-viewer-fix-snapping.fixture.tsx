import { applyEditEventsToManualEditsFile } from "@tscircuit/core"
import type { CircuitJson } from "circuit-json"
import { renderToCircuitJson } from "lib/dev/render-to-circuit-json"
import { SchematicViewer } from "lib/index"
import type { ManualEditEvent } from "lib/types/edit-events"
import { useEffect, useState } from "react"
import type { ManualEditsFile } from "@tscircuit/props"

export default () => {
  const [editEvents, setEditEvents] = useState<ManualEditEvent[]>([])
  const [circuitJson, setCircuitJson] = useState<CircuitJson | null>(null)
  const [manualEdits, setManualEdits] = useState<ManualEditsFile>({
    schematic_placements: [
      {
        center: {
          x: 2,
          y: 3,
        },
        relative_to: "group_center",
        selector: "C1",
      },
    ],
  })

  const rerenderCircuitJson = () => {
    setCircuitJson(
      renderToCircuitJson(
        <board width="10mm" height="10mm" manualEdits={manualEdits}>
          <resistor name="R1" resistance={1000} />
          <capacitor name="C1" capacitance="1uF" />
          <trace from=".R1 .pin2" to=".C1 .pin1" />
        </board>,
      ) as any,
    )
  }

  useEffect(() => {
    rerenderCircuitJson()
  }, [])

  useEffect(() => {
    // Apply edit events to manual edits for persistence between renders
    const updatedManualEdits = applyEditEventsToManualEditsFile({
      circuitJson: circuitJson ?? ([] as any),
      editEvents,
      manualEditsFile: manualEdits,
    })
    setManualEdits(updatedManualEdits)
  }, [editEvents, circuitJson])

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
        onClick={() => {
          setEditEvents([])
        }}
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
        onEditEvent={(event) => {
          setEditEvents((prev) => [...prev, event])
        }}
        circuitJson={circuitJson ?? []}
        containerStyle={{ height: "100%" }}
        debugGrid
        editingEnabled
      />
    </div>
  )
}
