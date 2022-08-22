import * as Type from "lib/types"
import { directionToVec, vecToDirection } from "lib/utils/direction-to-vec"
import findRectilinearRoute from "rectilinear-router"
import { sub, componentSum, mult, norm } from "lib/utils/point-math"

type Edge = {
  from: { x: number; y: number; ti?: number }
  to: { x: number; y: number; ti?: number }
}

function negUnacceptable(n: number) {
  if (n < 0) return -10000
  return n
}

function samePoint(p1: { x: number; y: number }, p2: { x: number; y: number }) {
  return p1.x === p2.x && p1.y === p2.y
}

function getNonCornerPoints(e1: Edge, e2: Edge) {
  const [p1, p2, p3, p4] = [e1.from, e1.to, e2.from, e2.to]
  if (samePoint(p1, p3)) return { p1: p2, p2: p4, corner: p1 }
  else if (samePoint(p1, p4)) return { p1: p2, p2: p3, corner: p1 }
  else if (samePoint(p2, p3)) return { p1, p2: p4, corner: p2 }
  else if (samePoint(p2, p4)) return { p1, p2: p3, corner: p2 }
  else throw new Error("Not a Corner")
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

  const edges = route.map(
    ({ from, to, fromTerminalIndex, toTerminalIndex }) => ({
      from: { x: from[0], y: from[1], ti: fromTerminalIndex },
      to: { x: to[0], y: to[1], ti: toTerminalIndex },
    })
  )

  // Flip edges if they are entering the port incorrectly, or could enter the
  // port more ergonomically (via the facing_direction)
  // TODO also check obstacles
  for (let i = 0; i < edges.length - 1; i++) {
    try {
      const e1 = edges[i]
      const e2 = edges[i + 1]
      const { p1, p2, corner } = getNonCornerPoints(e1, e2)
      const p1Dir = terminals[p1.ti]?.facing_direction
      const p2Dir = terminals[p2.ti]?.facing_direction

      // Score measures alignment of the port and the edge it's connected to
      let score1 = 0,
        score2 = 0

      if (p1Dir) {
        const p1Vec = directionToVec(p1Dir)
        const p1ToCornerVec = norm(sub(corner, p1))
        score1 += negUnacceptable(componentSum(mult(p1Vec, p1ToCornerVec)))
      }

      if (p2Dir) {
        const p2Vec = directionToVec(p2Dir)
        const p2ToCornerVec = norm(sub(corner, p2))
        score1 += negUnacceptable(componentSum(mult(p2Vec, p2ToCornerVec)))
      }

      flipEdges(e1, e2)

      if (p1Dir) {
        const p1Vec = directionToVec(p1Dir)
        const p1ToCornerVec = norm(sub(corner, p1))
        score2 += negUnacceptable(componentSum(mult(p1Vec, p1ToCornerVec)))
      }

      if (p2Dir) {
        const p2Vec = directionToVec(p2Dir)
        const p2ToCornerVec = norm(sub(corner, p2))
        score2 += negUnacceptable(componentSum(mult(p2Vec, p2ToCornerVec)))
      }

      if (score2 < score1) {
        // restore original flip
        flipEdges(e1, e2)
      }
    } catch (e) {
      if (!e.toString().includes("Not a Corner")) throw e
    }
  }

  return edges
}
