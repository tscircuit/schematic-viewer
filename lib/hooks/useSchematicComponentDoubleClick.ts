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
const HOVER_HIGHLIGHT_STROKE_WIDTH = "2.5px"

type StylableElement = HTMLElement | SVGElement

const isStylableElement = (element: Element): element is StylableElement =>
  element instanceof HTMLElement || element instanceof SVGElement

const isSvgElement = (element: StylableElement): element is SVGElement =>
  element instanceof SVGElement

const HIGHLIGHT_TARGET_SELECTOR =
  "path, rect, circle, ellipse, line, polyline, polygon, use, image"

const isComponentOverlayRect = (
  element: Element,
): element is SVGRectElement =>
  element instanceof SVGRectElement &&
  element.classList.contains("component-overlay")

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
        }>
      }
    >()

    const hoverListeners = new Map<
      HTMLElement,
      { enter: (event: Event) => void; leave: (event: Event) => void }
    >()

    componentElements.forEach((element) => {
      const highlightTargets = Array.from(
        element.querySelectorAll(HIGHLIGHT_TARGET_SELECTOR),
      )
        .filter((target) => !isComponentOverlayRect(target))
        .filter(isStylableElement)

      if (highlightTargets.length === 0 && isStylableElement(element)) {
        highlightTargets.push(element)
      }

      const highlightTargetState = highlightTargets.map((target) => {
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

        const transitionsToEnsure = isSvgElement(target)
          ? ["stroke 120ms ease", "stroke-width 120ms ease"]
          : ["outline 120ms ease"]

        target.style.transition = ensureTransitions(
          target.style.transition,
          transitionsToEnsure,
        )

        return {
          element: target,
          stroke: previousStroke,
          strokeWidth: previousStrokeWidth,
          outline: previousOutline,
          transition: previousTransition,
        }
      })

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
