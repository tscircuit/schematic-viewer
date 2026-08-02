import type { Matrix } from "transformation-matrix"

export type BlockedScreenRegionsProvider = () => DOMRect[] | undefined

function rectsIntersect(a: DOMRect, b: DOMRect): boolean {
  return !(
    a.right <= b.left ||
    a.left >= b.right ||
    a.bottom <= b.top ||
    a.top >= b.bottom
  )
}

/**
 * Clamps a proposed new center (in real mm) so that the moved element's future
 * screen-space bounding box never intersects any of the reserved regions
 * (e.g. the sheet title block). If the direct move would overlap, we back off
 * to the last non-overlapping delta on each axis independently — this lets the
 * user slide *along* the region's edge instead of getting stuck.
 */
export function clampCenterAgainstBlockedRegions({
  currentBBox,
  originalCenter,
  proposedCenter,
  realToScreenProjection,
  blockedRegions,
}: {
  currentBBox: DOMRect
  originalCenter: { x: number; y: number }
  proposedCenter: { x: number; y: number }
  realToScreenProjection: Matrix
  blockedRegions: DOMRect[]
}): { x: number; y: number } {
  if (blockedRegions.length === 0) return proposedCenter

  const deltaMm = {
    x: proposedCenter.x - originalCenter.x,
    y: proposedCenter.y - originalCenter.y,
  }
  const deltaPx = {
    x: deltaMm.x * realToScreenProjection.a,
    y: deltaMm.y * realToScreenProjection.d,
  }

  const project = (dxPx: number, dyPx: number): DOMRect =>
    new DOMRect(
      currentBBox.left + dxPx,
      currentBBox.top + dyPx,
      currentBBox.width,
      currentBBox.height,
    )

  const overlaps = (bbox: DOMRect) =>
    blockedRegions.some((region) => rectsIntersect(bbox, region))

  if (!overlaps(project(deltaPx.x, deltaPx.y))) return proposedCenter

  // Try clamping one axis at a time so sliding along the edge still feels
  // natural. Prefer whichever axis kept us clear.
  const xOnlyClear = !overlaps(project(deltaPx.x, 0))
  const yOnlyClear = !overlaps(project(0, deltaPx.y))
  if (xOnlyClear) return { x: proposedCenter.x, y: originalCenter.y }
  if (yOnlyClear) return { x: originalCenter.x, y: proposedCenter.y }
  return originalCenter
}
