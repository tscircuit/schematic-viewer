import { useMemo, useState } from "react"
import { su } from "@tscircuit/soup-util"
import { renderToCircuitJson } from "lib/dev/render-to-circuit-json"
import type { ManualEditEvent } from "lib/types/edit-events"
import { SchematicViewer } from "lib/index"
import type { CircuitJson } from "circuit-json"

const buildCircuit = (includeC2: boolean) =>
  renderToCircuitJson(
    <board width="14mm" height="10mm">
      <resistor name="R1" resistance={1000} schX={-4} />
      <capacitor name="C1" capacitance="1uF" schX={0} />
      {includeC2 && <capacitor name="C2" capacitance="1uF" schX={4} />}
      <trace from=".R1 .pin2" to=".C1 .pin1" />
      {includeC2 && <trace from=".C1 .pin2" to=".C2 .pin1" />}
    </board>,
  ) as CircuitJson

const findSchematicComponentIdByName = (
  circuitJson: CircuitJson,
  name: string,
) => {
  const sourceComponent = su(circuitJson)
    .source_component.list()
    .find((c) => c.name === name)
  if (!sourceComponent) return undefined
  return su(circuitJson)
    .schematic_component.list()
    .find((c) => c.source_component_id === sourceComponent.source_component_id)
    ?.schematic_component_id
}

/**
 * Regression fixture for the "stale edit event stops trace dashing" bug:
 * once an edit event references a schematic_component_id that no longer
 * exists in circuitJson, every edit event *after* it (including the one for
 * the component you're actively dragging) used to silently stop getting its
 * dashed-trace styling.
 */
export default () => {
  const initialCircuitJson = useMemo(() => buildCircuit(true), [])
  const [circuitJson, setCircuitJson] =
    useState<CircuitJson>(initialCircuitJson)
  const [editEvents, setEditEvents] = useState<ManualEditEvent[]>([])

  const simulateStaleEditEvent = () => {
    const staleComponentId = findSchematicComponentIdByName(
      initialCircuitJson,
      "C2",
    )
    if (!staleComponentId) return

    setEditEvents([
      {
        edit_event_id: "stale-c2-edit",
        edit_event_type: "edit_schematic_component_location",
        schematic_component_id: staleComponentId,
        original_center: { x: 4, y: 0 },
        new_center: { x: 5, y: 1 },
        in_progress: false,
        created_at: Date.now(),
      },
    ])
    // Remove C2 from the rendered circuit so the edit event above is stale --
    // it references a schematic_component_id that no longer exists.
    setCircuitJson(buildCircuit(false))
  }

  return (
    <div style={{ position: "relative", height: "100%" }}>
      <div
        style={{
          position: "absolute",
          top: "16px",
          left: "16px",
          zIndex: 1001,
          maxWidth: "360px",
          backgroundColor: "#fff",
          padding: "12px",
          borderRadius: "4px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          fontFamily: "sans-serif",
          fontSize: "13px",
          lineHeight: 1.5,
        }}
      >
        <strong>Regression check: stale edit event trace dashing</strong>
        <ol style={{ paddingLeft: "18px", margin: "8px 0" }}>
          <li>
            Click "Simulate stale edit + remove C2" — this queues an edit event
            for C2, then removes C2 from circuitJson (mirroring a consumer
            swapping in a new circuit while an old edit event is still around).
          </li>
          <li>
            Drag R1 or C1. Their connected trace should turn dashed while
            dragging. Before the fix, the stale C2 edit event stopped processing
            early and no trace would dash.
          </li>
        </ol>
        <button
          type="button"
          onClick={simulateStaleEditEvent}
          style={{
            padding: "8px 12px",
            borderRadius: "4px",
            border: "none",
            backgroundColor: "#f44336",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Simulate stale edit + remove C2
        </button>
      </div>
      <SchematicViewer
        circuitJson={circuitJson}
        editEvents={editEvents}
        onEditEvent={(event) => setEditEvents([...editEvents, event])}
        containerStyle={{ height: "100%" }}
        debugGrid
        editingEnabled
      />
    </div>
  )
}
