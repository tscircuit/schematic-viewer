import type { CircuitJson } from "circuit-json"
import { SchematicViewer } from "lib/components/SchematicViewer"
import circuitJson from "./am3352-dev-board-4layer-dogbone.circuit.json"

export default () => (
  <SchematicViewer
    circuitJson={circuitJson as CircuitJson}
    containerStyle={{ width: "100vw", height: "100vh" }}
  />
)
