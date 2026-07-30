import type { Matrix } from "transformation-matrix"

export const getSearchResultTransform = ({
  containerRect,
  targetRect,
  visibleProjection,
  minimumScale,
}: {
  containerRect: Pick<DOMRect, "left" | "top" | "width" | "height">
  targetRect: Pick<DOMRect, "left" | "top" | "width" | "height">
  visibleProjection: Matrix
  minimumScale: number
}): Matrix => {
  const currentScale = visibleProjection.a || 1
  const targetCenterInContainer = {
    x: targetRect.left + targetRect.width / 2 - containerRect.left,
    y: targetRect.top + targetRect.height / 2 - containerRect.top,
  }
  const targetCenterBeforeViewerTransform = {
    x: (targetCenterInContainer.x - visibleProjection.e) / currentScale,
    y: (targetCenterInContainer.y - visibleProjection.f) / currentScale,
  }
  const targetScale = Math.max(currentScale, minimumScale)

  return {
    a: targetScale,
    b: 0,
    c: 0,
    d: targetScale,
    e:
      containerRect.width / 2 -
      targetCenterBeforeViewerTransform.x * targetScale,
    f:
      containerRect.height / 2 -
      targetCenterBeforeViewerTransform.y * targetScale,
  }
}
