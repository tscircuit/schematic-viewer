import { useEffect } from "react"
import type { RefObject } from "react"

interface UseSchematicComponentDoubleClickOptions {
  svgDivRef: RefObject<HTMLDivElement>
  svgString: string
  onClickComponent?: (args: {
    schematicComponentId: string
    event: MouseEvent
  }) => void
  clickToInteractEnabled: boolean
  isInteractionEnabled: boolean
  showSpiceOverlay: boolean
}

const HOVER_HIGHLIGHT_COLOR = "#0d47a1"
const HOVER_HIGHLIGHT_STROKE_WIDTH = 1.5
const HOVER_HIGHLIGHT_PADDING = 4

const isSvgElement = (element: Element): element is SVGElement =>
  element instanceof SVGElement

const isSvgGraphicsElement = (
  element: Element,
): element is SVGGraphicsElement =>
  "getBBox" in element && typeof element.getBBox === "function"

const HIGHLIGHT_TARGET_SELECTOR =
  "path, rect, circle, ellipse, line, polyline, polygon, use, image"

const getGraphicsElementsWithin = (element: Element) =>
  Array.from(element.querySelectorAll(HIGHLIGHT_TARGET_SELECTOR)).filter(
    (child): child is SVGGraphicsElement => isSvgGraphicsElement(child),
  )

type BoundingBox = {
  x: number
  y: number
  width: number
  height: number
}

const toBoundingBox = (bbox: DOMRect | SVGRect): BoundingBox => ({
  x: bbox.x,
  y: bbox.y,
  width: bbox.width,
  height: bbox.height,
})

const getComponentOverlayBoundingBox = (
  element: Element,
): BoundingBox | null => {
  const overlay = element.querySelector(
    ".component-overlay",
  ) as SVGGraphicsElement | null

  if (overlay && isSvgGraphicsElement(overlay)) {
    const bbox = overlay.getBBox()
    if (bbox.width > 0 && bbox.height > 0) {
      return toBoundingBox(bbox)
    }
  }

  return null
}

const computeBoundingBox = (element: Element): BoundingBox | null => {
  const overlayBoundingBox = getComponentOverlayBoundingBox(element)
  if (overlayBoundingBox) {
    return overlayBoundingBox
  }

  const graphicsElements = getGraphicsElementsWithin(element)

  if (graphicsElements.length > 0) {
    return graphicsElements.reduce<BoundingBox | null>(
      (accumulator, graphic) => {
        const bbox = graphic.getBBox()

        if (!accumulator) {
          return toBoundingBox(bbox)
        }

        const minX = Math.min(accumulator.x, bbox.x)
        const minY = Math.min(accumulator.y, bbox.y)
        const maxX = Math.max(
          accumulator.x + accumulator.width,
          bbox.x + bbox.width,
        )
        const maxY = Math.max(
          accumulator.y + accumulator.height,
          bbox.y + bbox.height,
        )

        return {
          x: minX,
          y: minY,
          width: maxX - minX,
          height: maxY - minY,
        }
      },
      null,
    )
  }

  if (isSvgGraphicsElement(element)) {
    const bbox = element.getBBox()
    if (bbox.width > 0 && bbox.height > 0) {
      return toBoundingBox(bbox)
    }
  }

  return null
}

export const useSchematicComponentDoubleClick = ({
  svgDivRef,
  svgString,
  onClickComponent,
  clickToInteractEnabled,
  isInteractionEnabled,
  showSpiceOverlay,
}: UseSchematicComponentDoubleClickOptions) => {
  useEffect(() => {
    const svgContainer = svgDivRef.current
    if (!svgContainer || !onClickComponent) return

    const ownerSvg = svgContainer.querySelector("svg")
    if (!ownerSvg) return

    const componentElements = Array.from(
      svgContainer.querySelectorAll(
        '[data-circuit-json-type="schematic_component"]',
      ),
    ) as HTMLElement[]

    const previousElementState = new Map<
      HTMLElement,
      { cursor: string | null; pointerEventsAttr: string | null }
    >()

    const highlightRect = ownerSvg.ownerDocument?.createElementNS(
      "http://www.w3.org/2000/svg",
      "rect",
    )

    if (!highlightRect) return

    highlightRect.setAttribute("fill", "none")
    highlightRect.setAttribute("vector-effect", "non-scaling-stroke")
    highlightRect.setAttribute("stroke-linejoin", "miter")
    highlightRect.style.pointerEvents = "none"
    highlightRect.style.visibility = "hidden"

    ownerSvg.appendChild(highlightRect)

    const interactiveElements = new Set(componentElements)
    const componentBounds = new Map<HTMLElement, BoundingBox>()

    componentElements.forEach((element) => {
      previousElementState.set(element, {
        cursor: element.style.cursor || null,
        pointerEventsAttr: element.getAttribute("pointer-events"),
      })

      element.style.cursor = "pointer"
      if (isSvgElement(element)) {
        element.setAttribute("pointer-events", "bounding-box")
      }

      const bbox = computeBoundingBox(element)
      if (bbox) {
        componentBounds.set(element, bbox)
      }
    })

    const isInteractionBlocked = () =>
      (clickToInteractEnabled && !isInteractionEnabled) || showSpiceOverlay

    const hideHighlight = () => {
      highlightRect.style.visibility = "hidden"
    }

    const showHighlightFor = (component: HTMLElement) => {
      const bbox = componentBounds.get(component) ?? computeBoundingBox(component)
      if (!bbox) {
        hideHighlight()
        return
      }

      const paddedX = bbox.x - HOVER_HIGHLIGHT_PADDING
      const paddedY = bbox.y - HOVER_HIGHLIGHT_PADDING
      const paddedWidth = bbox.width + HOVER_HIGHLIGHT_PADDING * 2
      const paddedHeight = bbox.height + HOVER_HIGHLIGHT_PADDING * 2

      highlightRect.setAttribute("x", paddedX.toString())
      highlightRect.setAttribute("y", paddedY.toString())
      highlightRect.setAttribute("width", paddedWidth.toString())
      highlightRect.setAttribute("height", paddedHeight.toString())
      highlightRect.setAttribute("stroke", HOVER_HIGHLIGHT_COLOR)
      highlightRect.setAttribute(
        "stroke-width",
        `${HOVER_HIGHLIGHT_STROKE_WIDTH}`,
      )
      highlightRect.style.visibility = "visible"
    }

    const findComponent = (element: EventTarget | null) => {
      if (!(element instanceof Element)) return null
      const component = element.closest(
        '[data-circuit-json-type="schematic_component"]',
      )
      return component instanceof HTMLElement && interactiveElements.has(component)
        ? component
        : null
    }

    const handlePointerMove = (event: PointerEvent) => {
      if (isInteractionBlocked()) {
        hideHighlight()
        return
      }

      const component =
        findComponent(event.target) ??
        findComponent(
          svgContainer.ownerDocument?.elementFromPoint(
            event.clientX,
            event.clientY,
          ) ?? null,
        )

      if (!component) {
        hideHighlight()
        return
      }

      showHighlightFor(component)
    }

    const handlePointerLeave = () => {
      hideHighlight()
    }

    const handleDoubleClick = (event: MouseEvent) => {
      if (isInteractionBlocked()) {
        return
      }

      const component = findComponent(event.target)
      if (!component) return

      const schematicComponentId = component.getAttribute(
        "data-schematic-component-id",
      )

      if (!schematicComponentId) return

      onClickComponent({ schematicComponentId, event })
    }

    svgContainer.addEventListener("pointermove", handlePointerMove)
    svgContainer.addEventListener("pointerleave", handlePointerLeave)
    svgContainer.addEventListener("dblclick", handleDoubleClick)

    return () => {
      svgContainer.removeEventListener("pointermove", handlePointerMove)
      svgContainer.removeEventListener("pointerleave", handlePointerLeave)
      svgContainer.removeEventListener("dblclick", handleDoubleClick)

      if (highlightRect.parentNode) {
        highlightRect.parentNode.removeChild(highlightRect)
      }

      componentElements.forEach((element) => {
        const previous = previousElementState.get(element)
        if (!previous) return

        if (previous.pointerEventsAttr) {
          element.setAttribute("pointer-events", previous.pointerEventsAttr)
        } else {
          element.removeAttribute("pointer-events")
        }

        if (previous.cursor) {
          element.style.cursor = previous.cursor
        } else {
          element.style.removeProperty("cursor")
        }
      })
    }
  }, [
    svgString,
    onClickComponent,
    clickToInteractEnabled,
    isInteractionEnabled,
    showSpiceOverlay,
    svgDivRef,
  ])
}
