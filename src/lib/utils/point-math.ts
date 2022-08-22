export type Point = { x: number; y: number }

export function sub(p1: Point, p2: Point) {
  return { x: p1.x - p2.x, y: p1.y - p2.y }
}

export function mult(p1: Point, p2: Point) {
  return { x: p1.x * p2.x, y: p1.y * p2.y }
}

export function mag(p1: Point, p2: Point) {
  const dx = p1.x - p2.x
  const dy = p1.y - p2.y
  return Math.sqrt(dx ** 2 + dy ** 2)
}

export function componentSum(p1: Point) {
  return p1.x + p1.y
}
