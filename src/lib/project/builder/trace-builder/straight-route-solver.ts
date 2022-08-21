import * as Type from "lib/types"

/**
 * Straight Route Solver
 * This basically just connects the terminals in the provided order, simple and
 * naive.
 */
export const straightRouteSolver: Type.RouteSolver = async ({
  terminals,
  obstacles,
}) => {
  const edges = []
  for (let i = 0; i < terminals.length - 1; i++) {
    edges.push({
      from: terminals[i],
      to: terminals[i + 1],
    })
  }
  return edges
}
