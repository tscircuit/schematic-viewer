import React from "react"
import { createRoot } from "react-dom/client"
import { renderToCircuitJson } from "lib/dev/render-to-circuit-json"
import { SchematicViewer } from "lib/components/SchematicViewer"

const root = createRoot(document.getElementById("root")!)

root.render(
  <React.StrictMode>
    <div style={{ width: "100vw", height: "100vh" }}>
      <SchematicViewer
        circuitJson={renderToCircuitJson(
          <board width="10mm" height="10mm">
            <resistor name="R1" resistance={1000} />
          </board>,
        )}
        containerStyle={{ height: "100%" }}
      />
    </div>
  </React.StrictMode>,
)
