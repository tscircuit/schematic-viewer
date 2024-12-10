import * as Core from "@tscircuit/core"
console.log(Core)

export const renderToCircuitJson = (board: React.ReactElement) => {
  const circuit = new Core.Circuit()
  circuit.add(board)
  return circuit.getCircuitJson()
}
