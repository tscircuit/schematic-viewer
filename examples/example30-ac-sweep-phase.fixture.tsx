import { AnalogSimulationViewer } from "lib/components/AnalogSimulationViewer"
import {
  acSweepCircuitJson,
  withSchematicCircuitJson,
} from "./analog-analysis-circuit-json"

const circuitJson = withSchematicCircuitJson(acSweepCircuitJson)

export default () => (
  <AnalogSimulationViewer
    circuitJson={circuitJson}
    acSweepView="phase"
    containerStyle={{ width: "100vw", height: "100vh" }}
  />
)
