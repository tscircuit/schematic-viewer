import * as Core from "@tscircuit/core"

export const renderToCircuitJson = (board: React.ReactElement) => {
  const circuit = new Core.Circuit()
  circuit.add(board)
  return circuit.getCircuitJson()
}
