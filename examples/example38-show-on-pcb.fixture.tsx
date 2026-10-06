import { SchematicViewer } from "lib/components/SchematicViewer"
import { renderToCircuitJson } from "lib/dev/render-to-circuit-json"
import type { ViewPcbComponentEvent } from "lib/utils/get-pcb-component-at-element"
import { useState } from "react"

const circuitJson = renderToCircuitJson(
  <board width="12mm" height="12mm" routingDisabled>
    <resistor name="R1" resistance="1k" footprint="0603" schX={-2} pcbX={-2} />
    <capacitor
      name="C1"
      capacitance="100nF"
      footprint="0603"
      schX={2}
      pcbX={2}
    />
    <trace from=".R1 .pin2" to=".C1 .pin1" />
  </board>,
)

export default function ShowOnPcbFixture() {
  const [requestedComponent, setRequestedComponent] =
    useState<ViewPcbComponentEvent | null>(null)

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: 16, fontFamily: "sans-serif" }}>
        Right-click R1 or C1 to see Show on PCB. Right-click the background for
        viewer settings.
        <div role="status" style={{ marginTop: 8 }}>
          {requestedComponent
            ? `Show on PCB requested for ${requestedComponent.refdes} (${requestedComponent.pcb_component_id})`
            : "Select Show on PCB to see the requested component here."}
        </div>
      </div>
      <div style={{ flex: 1, minHeight: 320 }}>
        <SchematicViewer
          circuitJson={circuitJson}
          onViewPcbComponent={setRequestedComponent}
          containerStyle={{ height: "100%" }}
        />
      </div>
    </div>
  )
}
