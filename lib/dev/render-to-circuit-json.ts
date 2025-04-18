import * as Core from "@tscircuit/core"
import type { CircuitJson } from "circuit-json"

export const renderToCircuitJson = (board: React.ReactElement) => {
  const circuit = new Core.Circuit()
  circuit.add(board)
  return circuit.getCircuitJson() as CircuitJson
}
