import { AnalogSimulationViewer } from "lib/components/AnalogSimulationViewer"
import {
  dcSweepCircuitJson,
  withSchematicCircuitJson,
} from "./analog-analysis-circuit-json"

const circuitJson = withSchematicCircuitJson(dcSweepCircuitJson)

export default () => (
  <AnalogSimulationViewer
    circuitJson={circuitJson}
    containerStyle={{ width: "100vw", height: "100vh" }}
  />
)
