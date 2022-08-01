import svgPathBounds from "svg-path-bounds"

export function getSVGPathBounds(ds: string[] | string) {
  if (typeof ds === "string") ds = [ds]
  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity

  for (const d of ds) {
    const [left, top, right, bottom] = svgPathBounds(d)

    minX = Math.min(left, minX)
    maxX = Math.max(right, maxX)
    minY = Math.min(top, minY)
    maxY = Math.max(bottom, maxY)
  }

  return { minX, maxX, minY, maxY, width: maxX - minX, height: maxY - minY }
}

export default getSVGPathBounds
