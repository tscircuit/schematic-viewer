import { SimulationViewer } from "lib/components/SimulationViewer"
import {
  acSweepCircuitJson,
  withSchematicCircuitJson,
} from "./analog-analysis-circuit-json"

const circuitJson = withSchematicCircuitJson(acSweepCircuitJson)

export default () => (
  <SimulationViewer
    circuitJson={circuitJson}
    acSweepView="magnitude"
    containerStyle={{ width: "100vw", height: "100vh" }}
  />
)
