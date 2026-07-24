import { AnalogSimulationViewer } from "lib/components/AnalogSimulationViewer"
import {
  parameterSweepCircuitJson,
  withSchematicCircuitJson,
} from "./analog-analysis-circuit-json"

const circuitJson = withSchematicCircuitJson(parameterSweepCircuitJson)

export default () => (
  <AnalogSimulationViewer
    circuitJson={circuitJson}
    containerStyle={{ width: "100vw", height: "100vh" }}
  />
)
