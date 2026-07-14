export function computeTraceRoute(
  from: { x: number; y: number },
  to: { x: number; y: number },
): Array<{ x: number; y: number }> {
  if (Math.abs(from.x - to.x) < 1e-6 || Math.abs(from.y - to.y) < 1e-6) {
    return [from, to]
  }

  const viaHFirst = { x: to.x, y: from.y }
  const viaVFirst = { x: from.x, y: to.y }
  const lenH =
    Math.abs(from.x - viaHFirst.x) +
    Math.abs(from.y - viaHFirst.y) +
    Math.abs(viaHFirst.x - to.x) +
    Math.abs(viaHFirst.y - to.y)
  const lenV =
    Math.abs(from.x - viaVFirst.x) +
    Math.abs(from.y - viaVFirst.y) +
    Math.abs(viaVFirst.x - to.x) +
    Math.abs(viaVFirst.y - to.y)

  const corner = lenH <= lenV ? viaHFirst : viaVFirst
  return [from, corner, to]
}
