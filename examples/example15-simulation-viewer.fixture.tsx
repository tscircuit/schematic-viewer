import type { CircuitJson } from "circuit-json"
import { SimulationViewer } from "../lib/components/SimulationViewer"
import ddrSimulation from "./ddr-simulation.circuit.json"

// Native DDR_SWITCHING / DQ0_RX results; see ddr-simulation.provenance.json.
export default () => (
  <SimulationViewer
    circuitJson={ddrSimulation as CircuitJson}
    hideSchematic
    containerStyle={{ width: "100vw", height: "100vh" }}
  />
)
