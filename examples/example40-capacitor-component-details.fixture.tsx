import { SchematicViewer } from "lib/components/SchematicViewer"
import { renderToCircuitJson } from "lib/dev/render-to-circuit-json"

export default () => (
  <SchematicViewer
    circuitJson={renderToCircuitJson(
      <board width="10mm" height="10mm">
        <capacitor
          name="C21"
          capacitance="4.7uF"
          maxVoltageRating="50V"
          footprint="0603"
          schShowRatings
        />
      </board>,
    )}
    containerStyle={{ height: "100%" }}
  />
)
