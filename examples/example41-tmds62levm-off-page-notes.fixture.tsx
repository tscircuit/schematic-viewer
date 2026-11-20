import type { CircuitJson } from "circuit-json"
import { SchematicViewer } from "lib/components/SchematicViewer"
import sheet25 from "./tmds62levm-sheet-25.circuit.json"

export default () => (
  <SchematicViewer
    circuitJson={sheet25 as CircuitJson}
    containerStyle={{ width: "100vw", height: "100vh" }}
  />
)
