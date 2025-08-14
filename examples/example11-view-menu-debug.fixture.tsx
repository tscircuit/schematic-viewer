import { SchematicViewer } from "lib/components/SchematicViewer"
import { renderToCircuitJson } from "lib/dev/render-to-circuit-json"

export default () => {
  const circuitJson = renderToCircuitJson(
    <board width="20mm" height="15mm">
      <resistor name="R1" resistance={1000} schX={-2} />
      <capacitor name="C1" capacitance="1uF" schX={2} />
      <trace from=".R1 .pin2" to=".C1 .pin1" />
    </board>
  )

  // Log circuit JSON to see structure
  console.log("Circuit JSON:", circuitJson)
  
  // Log groups specifically
  try {
    const { su } = require('@tscircuit/soup-util')
    const sourceGroups = su(circuitJson).source_group?.list() || []
    const sourceComponents = su(circuitJson).source_component?.list() || []
    console.log("Source Groups:", sourceGroups)
    console.log("Source Components with groups:", sourceComponents.map((c: any) => ({
      name: c.name,
      ftype: c.ftype,
      source_group_id: c.source_group_id
    })))
  } catch (e) {
    console.log("Error analyzing groups:", e)
  }

  return (
    <div style={{ position: "relative", height: "100%" }}>
      <div
        style={{
          position: "absolute",
          top: "16px",
          left: "16px",
          zIndex: 1001,
          backgroundColor: "#fff",
          padding: "12px",
          borderRadius: "4px",
          border: "1px solid #ccc",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          fontSize: "14px",
          fontFamily: "sans-serif",
          maxWidth: "300px",
        }}
      >
        <strong>View Menu Debug</strong>
        <div style={{ marginTop: "8px", fontSize: "12px", color: "#666" }}>
          Simple circuit to test the view menu icon. Check console for circuit JSON structure.
          The view menu icon should appear in the top-right corner.
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          bottom: "16px",
          left: "16px",
          zIndex: 1001,
          backgroundColor: "#fff",
          padding: "8px",
          borderRadius: "4px",
          border: "1px solid #ccc",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          fontSize: "10px",
          fontFamily: "monospace",
          maxWidth: "400px",
          maxHeight: "200px",
          overflow: "auto",
        }}
      >
        <div style={{ fontWeight: "bold", marginBottom: "4px" }}>Circuit JSON Preview:</div>
        <pre>{JSON.stringify(circuitJson.slice(0, 3), null, 1)}</pre>
        <div style={{ marginTop: "4px", color: "#666" }}>
          ... and {circuitJson.length - 3} more items
        </div>
      </div>
      <SchematicViewer
        circuitJson={circuitJson}
        containerStyle={{ height: "100%" }}
        debugGrid
        editingEnabled
      />
    </div>
  )
}
