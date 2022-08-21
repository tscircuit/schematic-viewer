const points = [
  { x: 0, y: 400, d: "h" },
  { x: 300, y: 0, d: "v" },
  { x: 800, y: 1000, d: "h" },
]

const interceptPoints = [...points]
for (const p1 of points) {
  const haps = []
  for (const p2 of points) {
    const dx = p2.x - p1.x
    const dy = p2.y - p1.y
    const d1 = {
      x: p1.d === "h" ? 0 : dx / 2,
      y: p1.d === "v" ? 0 : dy / 2,
    }
    haps.push({
      x: p1.x + d1.x,
      y: p1.y + d1.y,
      halfAdjacent: true,
    })
  }
  for (const hap of haps) {
    const alreadyExists = interceptPoints.some(
      (ip) => ip.x === hap.x && ip.y === hap.y
    )
    if (!alreadyExists) interceptPoints.push(hap)
  }
}
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

export default () => {
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
          stroke={point.halfAdjacent ? "yellow" : "green"}
        />
      ))}
      {/* <line stroke="red" strokeWidth="5" x1="0" y1="0" x2="1000" y2="1000" /> */}
    </svg>
  )
}
