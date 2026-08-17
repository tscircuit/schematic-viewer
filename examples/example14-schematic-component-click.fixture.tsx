import { SchematicViewer } from "lib/components/SchematicViewer"
import { renderToCircuitJson } from "lib/dev/render-to-circuit-json"
import { useState } from "react"

const circuitJson = renderToCircuitJson(
  <board width="12mm" height="12mm">
    <resistor name="R1" resistance={1000} footprint="0603" schX={-2} schY={0} />
    <capacitor name="C1" capacitance="1uF" footprint="0603" schX={2} schY={0} />
    <trace from=".R1 .pin2" to=".C1 .pin1" />
    <trace from=".R1 .pin1" to=".C1 .pin2" />
  </board>,
)

export default function Example() {
  const [clickedComponentId, setClickedComponentId] = useState<string | null>(
    null,
  )

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        padding: "16px",
        height: "100%",
        boxSizing: "border-box",
      }}
    >
      <div style={{ fontFamily: "sans-serif" }}>
        {clickedComponentId
          ? `Last clicked component: ${clickedComponentId}`
          : "Click a component to inspect it"}
      </div>
      <div style={{ flex: 1, minHeight: 320 }}>
        <SchematicViewer
          circuitJson={circuitJson}
          containerStyle={{ height: "100%" }}
          onSchematicComponentClicked={({ schematicComponentId }) => {
            setClickedComponentId(schematicComponentId)
          }}
        />
      </div>
    </div>
  )
}
