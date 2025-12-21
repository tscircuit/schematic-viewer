import { AnalogSimulationViewer } from "lib/components/AnalogSimulationViewer"
import { renderToCircuitJson } from "lib/dev/render-to-circuit-json"

const circuitJson = renderToCircuitJson(
  <board width="10mm" height="10mm" routingDisabled></board>,
)

export default () => (
  <AnalogSimulationViewer
    circuitJson={circuitJson}
    containerStyle={{ height: "100%" }}
  />
)
