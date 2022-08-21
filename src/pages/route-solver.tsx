import { useEffect, useState } from "react"
import { Graph } from "graphlib"
import rsmt from "rsmt-ts"
import { findRectilinearRoute } from "rectilinear-router"
// import glpk from "glpk.js"

const points = [
  { x: 0, y: 400 },
  { x: 0, y: 200 },
  { x: 300, y: 0 },
  { x: 800, y: 800 },
  { x: 600, y: 1000 },
  { x: 500, y: 500 },
  { x: 200, y: 700 },
  { x: 700, y: 300 },
]

const interceptPoints = [...points]
// for (const p1 of points) {
//   const haps = []
//   for (const p2 of points) {
//     const dx = p2.x - p1.x
//     const dy = p2.y - p1.y
//     const d1 = {
//       x: p1.d === "h" ? 0 : dx / 2,
//       y: p1.d === "v" ? 0 : dy / 2,
//     }
//     haps.push({
//       x: p1.x + d1.x,
//       y: p1.y + d1.y,
//       halfAdjacent: true,
//     })
//   }
//   for (const hap of haps) {
//     const alreadyExists = interceptPoints.some(
//       (ip) => ip.x === hap.x && ip.y === hap.y
//     )
//     if (!alreadyExists) interceptPoints.push(hap)
//   }
// }
for (const ap of points) {
  // ap = point to add
  const newIntercepts = []
  for (const ip of interceptPoints) {
    // Add directly orthogonal points m1, m2
    const m1 = {
      x: ip.x,
      y: ap.y,
    }
    const m2 = {
      x: ap.x,
      y: ip.y,
    }
    newIntercepts.push(m1, m2)
  }
  for (const nip of newIntercepts) {
    const alreadyExists = interceptPoints.some(
      (ip) => ip.x === nip.x && ip.y === nip.y
    )
    if (!alreadyExists) interceptPoints.push(nip)
  }
}

const createSolver = () => {
  const s = {
    paths: [[points[0]]],
  }

  const tick = () => {
    // for
    // s.paths.push()
    // return s
    return s
  }

  return { tick }
}

function getEdgesFromSolution({ steiners = [], terminals = [] }) {
  const points = steiners.concat(terminals)
  const edges = []
  const addEdge = (p1, p2) => {
    // add edge if not already present
    if (
      edges.some(
        ([p3, p4]) => (p3 === p1 && p4 === p2) || (p3 === p2 && p4 === p1)
      )
    )
      return
    edges.push([p1, p2])
  }
  for (const p1 of points) {
    const nearest = {
      xp: null,
      xd: Infinity,
      yp: null,
      yd: Infinity,
    }
    for (const p2 of points) {
      if (p1 === p2) continue
      if (p1[0] === p2[0]) {
        // same x
        const yd = Math.abs(p1[1] - p2[1])
        if (yd < nearest.yd) {
          nearest.yp = p2
          nearest.yd = yd
        }
      }
      if (p1[1] === p2[1]) {
        // same y
        const xd = Math.abs(p1[0] - p2[0])
        if (xd < nearest.xd) {
          nearest.xp = p2
          nearest.xd = xd
        }
      }
    }
    if (nearest.xp) addEdge(p1, nearest.xp)
    if (nearest.yp) addEdge(p1, nearest.yp)
  }
  return Object.values(edges)
}

export default () => {
  const [s, setS] = useState(null)

  const [solution, setSolution] = useState(null)

  useEffect(() => {
    const solver = createSolver()

    const interval = setInterval(() => {
      setS(solver.tick())
    }, 100)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    async function compute() {
      setSolution(
        await findRectilinearRoute({
          terminals: points.map((p) => [p.x, p.y]),
        })
      )
    }
    compute()
  }, [])

  const edges = solution ? getEdgesFromSolution(solution) : []

  return (
    <svg width="1000" height="1000" viewBox="-50 -50 1100 1100">
      {points.map((point, index) => (
        <circle
          key={index}
          cx={point.x}
          cy={point.y}
          r="10"
          fill="none"
          stroke="black"
        />
      ))}
      {interceptPoints.map((point, index) => (
        <circle
          key={index}
          cx={point.x}
          cy={point.y}
          r="15"
          fill="none"
          stroke={"green"}
        />
      ))}
      {solution &&
        solution.map(({ from, to }, index) => (
          <line
            stroke="rgba(255,0,255,0.5)"
            strokeWidth="5"
            key={index}
            x1={from[0]}
            y1={from[1]}
            x2={to[0]}
            y2={to[1]}
          />
        ))}
    </svg>
  )
}
