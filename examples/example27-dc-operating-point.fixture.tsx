import { SimulationViewer } from "lib/components/SimulationViewer"
import {
  dcOperatingPointCircuitJson,
  withSchematicCircuitJson,
} from "./analog-analysis-circuit-json"

const circuitJson = withSchematicCircuitJson(dcOperatingPointCircuitJson)

export default () => (
  <SimulationViewer
    circuitJson={circuitJson}
    containerStyle={{ width: "100vw", height: "100vh" }}
  />
)
