import type { CircuitJson } from "circuit-json"
import { SchematicViewer } from "lib/components/SchematicViewer"
import circuitJson from "./pmp11282-isolated-dcdc.circuit.json"

/**
 * Visual reproduction from the source-derived PMP11282 isolated DC/DC TSX.
 *
 * The fixture intentionally uses the compiled Circuit JSON so this repository
 * exercises only viewer/SVG behavior. In particular, the generic component
 * bodies used for the transformer, coupled inductor, optocouplers, and dual
 * diodes make their pin labels and component text crowd or escape the yellow
 * schematic boxes at a full-sheet scale.
 *
 * Trace routing and fallback net-label generation are reproduced separately in
 * schematic-trace-solver; this viewer fixture preserves their rendered output.
 */
export default () => (
  <SchematicViewer
    circuitJson={circuitJson as CircuitJson}
    containerStyle={{ width: "100vw", height: "100vh" }}
  />
)
