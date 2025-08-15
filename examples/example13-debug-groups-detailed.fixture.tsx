import { SchematicViewer } from "lib/components/SchematicViewer"
import { renderToCircuitJson } from "lib/dev/render-to-circuit-json"

export default () => {
  const circuitJson = renderToCircuitJson(
    <board width="30mm" height="20mm">
      <resistor name="R1" resistance={1000} schX={-4} schY={0} />
      <resistor name="R2" resistance={2000} schX={0} schY={0} />
      <capacitor name="C1" capacitance="10uF" schX={4} schY={0} />
      <capacitor name="C2" capacitance="100uF" schX={8} schY={0} />
      <trace from=".R1 .pin2" to=".R2 .pin1" />
      <trace from=".R2 .pin2" to=".C1 .pin1" />
      <trace from=".C1 .pin2" to=".C2 .pin1" />
    </board>,
  )

  // Enhanced debugging
  console.log("=== DEBUG CIRCUIT JSON ===")
  console.log("Full circuit JSON:", circuitJson)
  
  const sourceComponents = circuitJson.filter(item => item.type === "source_component")
  const schematicComponents = circuitJson.filter(item => item.type === "schematic_component")
  const sourceGroups = circuitJson.filter(item => item.type === "source_group")
  
  console.log("Source components:", sourceComponents)
  console.log("Schematic components:", schematicComponents)
  console.log("Source groups:", sourceGroups)

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
          maxWidth: "400px",
        }}
      >
        <strong>Detailed Groups Debug</strong>
        <div style={{ marginTop: "8px", fontSize: "12px", color: "#666" }}>
          Circuit with multiple resistors and capacitors.
          <br />
          Open browser console to see detailed debug info.
          <br />
          Source components: {sourceComponents.length}
          <br />
          Schematic components: {schematicComponents.length}
          <br />
          Source groups: {sourceGroups.length}
          <br />
          <br />
          <strong>Expected behavior:</strong>
          <br />
          • Click menu (⋮) to open dropdown
          <br />
          • Check "View Schematic Groups" 
          <br />
          • Should see colored rectangles grouping resistors & capacitors
        </div>
      </div>

      <SchematicViewer
        circuitJson={circuitJson}
        containerStyle={{
          width: "100%",
          height: "100%",
          backgroundColor: "#f5f5f5",
        }}
        debugGrid={false}
        editingEnabled={false}
      />
    </div>
  )
}
