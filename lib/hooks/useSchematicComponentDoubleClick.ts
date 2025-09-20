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

const HOVER_HIGHLIGHT_COLOR = "#1976d2"
const HOVER_HIGHLIGHT_STROKE_WIDTH = "1.5px"
const HOVER_HIGHLIGHT_PADDING = 4

type StylableElement = HTMLElement | SVGElement

const isStylableElement = (element: Element): element is StylableElement =>
  element instanceof HTMLElement || element instanceof SVGElement

const isSvgElement = (element: StylableElement): element is SVGElement =>
  element instanceof SVGElement

const isSvgGraphicsElement = (
  element: Element,
): element is SVGGraphicsElement =>
  "getBBox" in element && typeof element.getBBox === "function"

const HIGHLIGHT_TARGET_SELECTOR =
  "path, rect, circle, ellipse, line, polyline, polygon, use, image"

const getOwnerSvg = (element: Element): SVGSVGElement | null => {
  if (element instanceof SVGGraphicsElement && element.ownerSVGElement) {
    return element.ownerSVGElement
  }

  const closestSvg = element.closest("svg")
  return closestSvg instanceof SVGSVGElement ? closestSvg : null
}

const getGraphicsElementsWithin = (element: Element) =>
  Array.from(element.querySelectorAll(HIGHLIGHT_TARGET_SELECTOR)).filter(
    (child): child is SVGGraphicsElement => isSvgGraphicsElement(child),
  )

const computeBoundingBox = (element: Element) => {
  if (isSvgGraphicsElement(element)) {
    const bbox = element.getBBox()
    if (bbox.width > 0 && bbox.height > 0) {
      return bbox
    }
  }

  const graphicsElements = getGraphicsElementsWithin(element)

  if (graphicsElements.length === 0) {
    return null
  }

  return graphicsElements.reduce<DOMRect | SVGRect | null>(
    (accumulator, graphic) => {
      const bbox = graphic.getBBox()

      if (!accumulator) {
        return bbox
      }

      const minX = Math.min(accumulator.x, bbox.x)
      const minY = Math.min(accumulator.y, bbox.y)
      const maxX = Math.max(accumulator.x + accumulator.width, bbox.x + bbox.width)
      const maxY = Math.max(accumulator.y + accumulator.height, bbox.y + bbox.height)

      return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
      } as DOMRect
    },
    null,
  )
}

const ensureTransitions = (
  existing: string | null,
  transitionsToAdd: string[],
) => {
  if (!existing || existing.trim().length === 0) {
    return transitionsToAdd.join(", ")
  }

  const parsed = existing
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)

  transitionsToAdd.forEach((transition) => {
    const property = transition.split(/\s+/)[0]
    const alreadyPresent = parsed.some((existingTransition) =>
      existingTransition.startsWith(property),
    )

    if (!alreadyPresent) {
      parsed.push(transition)
    }
  })

  return parsed.join(", ")
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
    if (!svgContainer) return

    if (!onClickComponent) return

    const handleDoubleClick = (event: MouseEvent) => {
      if (
        (clickToInteractEnabled && !isInteractionEnabled) ||
        showSpiceOverlay
      ) {
        return
      }

      const target = event.target as Element | null
      const componentGroup = target?.closest(
        '[data-circuit-json-type="schematic_component"]',
      ) as HTMLElement | null

      if (!componentGroup) return

      const schematicComponentId = componentGroup.getAttribute(
        "data-schematic-component-id",
      )

      if (!schematicComponentId) return

      onClickComponent({ schematicComponentId, event })
    }

    svgContainer.addEventListener("dblclick", handleDoubleClick)

    const componentElements = Array.from(
      svgContainer.querySelectorAll(
        '[data-circuit-json-type="schematic_component"]',
      ),
    ) as HTMLElement[]

    const previousElementState = new Map<
      HTMLElement,
      {
        cursor: string | null
        highlightTargets: Array<{
          element: StylableElement
          stroke: string | null
          strokeWidth: string | null
          outline: string | null
          transition: string | null
          pointerEvents: string | null
          removeOnCleanup: boolean
        }>
      }
    >()

    const hoverListeners = new Map<
      HTMLElement,
      { enter: (event: Event) => void; leave: (event: Event) => void }
    >()

    componentElements.forEach((element) => {
      const highlightTargets: Array<{
        element: StylableElement
        removeOnCleanup: boolean
      }> = []

      const ownerSvg = getOwnerSvg(element)
      const bbox = computeBoundingBox(element)

      if (ownerSvg && bbox && bbox.width > 0 && bbox.height > 0) {
        const highlightRect = ownerSvg.ownerDocument?.createElementNS(
          "http://www.w3.org/2000/svg",
          "rect",
        )

        if (highlightRect) {
          const paddedX = bbox.x - HOVER_HIGHLIGHT_PADDING
          const paddedY = bbox.y - HOVER_HIGHLIGHT_PADDING
          const paddedWidth = bbox.width + HOVER_HIGHLIGHT_PADDING * 2
          const paddedHeight = bbox.height + HOVER_HIGHLIGHT_PADDING * 2

          highlightRect.setAttribute("x", paddedX.toString())
          highlightRect.setAttribute("y", paddedY.toString())
          highlightRect.setAttribute("width", paddedWidth.toString())
          highlightRect.setAttribute("height", paddedHeight.toString())
          highlightRect.setAttribute("fill", "none")
          highlightRect.setAttribute("stroke", "none")
          highlightRect.setAttribute("vector-effect", "non-scaling-stroke")
          highlightRect.style.pointerEvents = "none"

          element.appendChild(highlightRect)

          highlightTargets.push({
            element: highlightRect,
            removeOnCleanup: true,
          })
        }
      }

      if (highlightTargets.length === 0) {
        const fallbackTargets = getGraphicsElementsWithin(element)

        if (fallbackTargets.length > 0) {
          fallbackTargets.forEach((target) =>
            highlightTargets.push({ element: target, removeOnCleanup: false }),
          )
        } else if (isStylableElement(element)) {
          highlightTargets.push({ element, removeOnCleanup: false })
        }
      }

      const highlightTargetState = highlightTargets.map(
        ({ element: target, removeOnCleanup }) => {
          const previousStroke = isSvgElement(target)
            ? target.style.stroke || null
            : null
          const previousStrokeWidth = isSvgElement(target)
            ? target.style.strokeWidth || null
            : null
          const previousOutline = !isSvgElement(target)
            ? target.style.outline || null
            : null
          const previousTransition = target.style.transition || null
          const previousPointerEvents = target.style.pointerEvents || null

          const transitionsToEnsure = isSvgElement(target)
            ? ["stroke 120ms ease", "stroke-width 120ms ease"]
            : ["outline 120ms ease"]

          target.style.transition = ensureTransitions(
            target.style.transition,
            transitionsToEnsure,
          )

          if (removeOnCleanup) {
            target.style.pointerEvents = "none"
          }

          return {
            element: target,
            stroke: previousStroke,
            strokeWidth: previousStrokeWidth,
            outline: previousOutline,
            transition: previousTransition,
            pointerEvents: previousPointerEvents,
            removeOnCleanup,
          }
        },
      )

      previousElementState.set(element, {
        cursor: element.style.cursor || null,
        highlightTargets: highlightTargetState,
      })

      element.style.cursor = "pointer"

      const handleMouseEnter = () => {
        const previous = previousElementState.get(element)
        if (!previous) return
        previous.highlightTargets.forEach(({ element: target }) => {
          if (isSvgElement(target)) {
            target.style.stroke = HOVER_HIGHLIGHT_COLOR
            target.style.strokeWidth = HOVER_HIGHLIGHT_STROKE_WIDTH
          } else {
            target.style.outline = `${HOVER_HIGHLIGHT_STROKE_WIDTH} solid ${HOVER_HIGHLIGHT_COLOR}`
          }
        })
      }

      const handleMouseLeave = () => {
        const previous = previousElementState.get(element)
        if (!previous) return
        previous.highlightTargets.forEach(
          ({ element: target, stroke, strokeWidth, outline }) => {
            if (isSvgElement(target)) {
              if (stroke) {
                target.style.stroke = stroke
              } else {
                target.style.removeProperty("stroke")
              }

              if (strokeWidth) {
                target.style.strokeWidth = strokeWidth
              } else {
                target.style.removeProperty("stroke-width")
              }
            } else if (outline) {
              target.style.outline = outline
            } else {
              target.style.removeProperty("outline")
            }
          },
        )
      }

      element.addEventListener("mouseenter", handleMouseEnter)
      element.addEventListener("mouseleave", handleMouseLeave)

      hoverListeners.set(element, {
        enter: handleMouseEnter,
        leave: handleMouseLeave,
      })
    })

    return () => {
      svgContainer.removeEventListener("dblclick", handleDoubleClick)

      componentElements.forEach((element) => {
        const previous = previousElementState.get(element)
        const listeners = hoverListeners.get(element)

        if (listeners) {
          element.removeEventListener("mouseenter", listeners.enter)
          element.removeEventListener("mouseleave", listeners.leave)
        }

        if (previous) {
          if (previous.cursor) {
            element.style.cursor = previous.cursor
          } else {
            element.style.removeProperty("cursor")
          }

          previous.highlightTargets.forEach(
            ({
              element: target,
              stroke,
              strokeWidth,
              outline,
              transition,
              pointerEvents,
              removeOnCleanup,
            }) => {
              if (isSvgElement(target)) {
                if (stroke) {
                  target.style.stroke = stroke
                } else {
                  target.style.removeProperty("stroke")
                }

                if (strokeWidth) {
                  target.style.strokeWidth = strokeWidth
                } else {
                  target.style.removeProperty("stroke-width")
                }
              } else if (outline) {
                target.style.outline = outline
              } else {
                target.style.removeProperty("outline")
              }

              if (pointerEvents) {
                target.style.pointerEvents = pointerEvents
              } else {
                target.style.removeProperty("pointer-events")
              }

              if (removeOnCleanup && target.parentNode) {
                target.parentNode.removeChild(target)
              }

              if (transition) {
                target.style.transition = transition
              } else {
                target.style.removeProperty("transition")
              }
            },
          )
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
