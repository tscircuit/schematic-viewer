import { AnalogSimulationViewer } from "lib/components/AnalogSimulationViewer"
import {
  dcOperatingPointCircuitJson,
  withSchematicCircuitJson,
} from "./analog-analysis-circuit-json"

const circuitJson = withSchematicCircuitJson(dcOperatingPointCircuitJson)

export default () => (
  <AnalogSimulationViewer
    circuitJson={circuitJson}
    containerStyle={{ width: "100vw", height: "100vh" }}
  />
)
