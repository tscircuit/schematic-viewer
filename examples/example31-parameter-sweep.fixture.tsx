import { SimulationViewer } from "lib/components/SimulationViewer"
import {
  parameterSweepCircuitJson,
  withSchematicCircuitJson,
} from "./analog-analysis-circuit-json"

const circuitJson = withSchematicCircuitJson(parameterSweepCircuitJson)

export default () => (
  <SimulationViewer
    circuitJson={circuitJson}
    containerStyle={{ width: "100vw", height: "100vh" }}
  />
)
