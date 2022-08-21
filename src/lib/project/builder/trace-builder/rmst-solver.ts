import * as Type from "lib/types"
import findRectilinearRoute from "rectilinear-router"

type Edge = { from: { x: number; y: number }; to: { x: number; y: number } }

function samePoint(p1: { x: number; y: number }, p2: { x: number; y: number }) {
  return p1.x === p2.x && p1.y === p2.y
}

function getNonCornerPoints(e1: Edge, e2: Edge) {
  const [p1, p2, p3, p4] = [e1.from, e1.to, e2.from, e2.to]
  if (samePoint(p1, p3)) return { p1: p2, p2: p4 }
  else if (samePoint(p1, p4)) return { p1: p2, p2: p3 }
  else if (samePoint(p2, p3)) return { p1, p2: p4 }
  else if (samePoint(p2, p4)) return { p1, p2: p3 }
  else throw new Error("Invalid edge")
}

function flipEdges(e1: Edge, e2: Edge) {
  const { p1, p2 } = getNonCornerPoints(e1, e2)
  const [x1, y1, x2, y2] = [p1.x, p1.y, p2.x, p2.y]
  const ogCornerType: "x2y1" | "x1y2" = x1 === e1.to.x ? "x1y2" : "x2y1"
  e1.from = { x: x1, y: y1 }
  e2.to = { x: x2, y: y2 }
  if (ogCornerType === "x2y1") {
    e1.to.x = e2.from.x = x1
    e1.to.y = e2.from.y = y2
  } else if (ogCornerType === "x1y2") {
    e1.to.x = e2.from.x = x2
    e1.to.y = e2.from.y = y1
  }
}

/** Rectilinear Minimum Steiner Tree Solver */
export const rmstSolver: Type.RouteSolver = async ({
  terminals,
  obstacles,
}) => {
  const route = await findRectilinearRoute({
    terminals: terminals.map(({ x, y }) => [x, y]),
  })

  const edges = route.map(({ from, to }) => ({
    from: { x: from[0], y: from[1] },
    to: { x: to[0], y: to[1] },
  }))

  flipEdges(edges[0], edges[1])

  return edges
}
