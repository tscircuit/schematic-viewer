import { SimulationViewer } from "lib/components/SimulationViewer"
import {
  dcSweepCircuitJson,
  withSchematicCircuitJson,
} from "./analog-analysis-circuit-json"

const circuitJson = withSchematicCircuitJson(dcSweepCircuitJson)

export default () => (
  <SimulationViewer
    circuitJson={circuitJson}
    containerStyle={{ width: "100vw", height: "100vh" }}
  />
)
