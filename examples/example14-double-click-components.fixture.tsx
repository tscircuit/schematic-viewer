import { ControlledSchematicViewer } from "lib/components/ControlledSchematicViewer"
import { renderToCircuitJson } from "lib/dev/render-to-circuit-json"

export default () => {
  const handleComponentDoubleClick = (componentId: string) => {
    console.log(`Component double-clicked: ${componentId}`)
  }

  return (
    <div style={{ position: "relative", height: "100%" }}>
      <div
        style={{
          position: "absolute",
          top: "16px",
          right: "64px",
          zIndex: 1001,
          backgroundColor: "#fff",
          padding: "12px",
          borderRadius: "4px",
          border: "1px solid #ccc",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          fontSize: "14px",
          fontFamily: "sans-serif",
        }}
      >
        Double-click a component to open editing dialog
      </div>
      <ControlledSchematicViewer
        circuitJson={renderToCircuitJson(
          <board width="10mm" height="10mm">
            <resistor name="R1" resistance={1000} schX={-2} />
            <capacitor name="C1" capacitance="1uF" schX={2} />
            <trace from=".R1 .pin2" to=".C1 .pin1" />
          </board>,
        )}
        containerStyle={{ height: "100%" }}
        onClickComponent={handleComponentDoubleClick}
      />
    </div>
  )
}
