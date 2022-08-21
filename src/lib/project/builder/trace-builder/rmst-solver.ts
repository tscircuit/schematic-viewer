import * as Type from "lib/types"
import findRectilinearRoute from "rectilinear-router"

/** Rectilinear Minimum Steiner Tree Solver */
export const rmstSolver: Type.RouteSolver = async ({
  terminals,
  obstacles,
}) => {
  const route = await findRectilinearRoute({
    terminals: terminals.map(({ x, y }) => [x, y]),
  })

  return route.map(({ from, to }) => ({
    from: { x: from[0], y: from[1] },
    to: { x: to[0], y: to[1] },
  }))
}
