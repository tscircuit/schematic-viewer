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

const HOVER_HIGHLIGHT_COLOR = "rgba(30, 128, 255, 0.8)"

const appendDropShadow = (
  existing: string | null,
  color: string,
  radius: number,
) => {
  const dropShadow = `drop-shadow(0 0 ${radius}px ${color})`
  return existing ? `${existing} ${dropShadow}` : dropShadow
}

const mergeTransition = (existing: string | null) => {
  if (!existing || existing.trim().length === 0) {
    return "filter 120ms ease"
  }

  if (existing.includes("filter")) {
    return existing
  }

  return `${existing}, filter 120ms ease`
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
        filter: string | null
        transition: string | null
      }
    >()

    const hoverListeners = new Map<
      HTMLElement,
      { enter: (event: Event) => void; leave: (event: Event) => void }
    >()

    componentElements.forEach((element) => {
      previousElementState.set(element, {
        cursor: element.style.cursor || null,
        filter: element.style.filter || null,
        transition: element.style.transition || null,
      })

      element.style.cursor = "pointer"
      element.style.transition = mergeTransition(element.style.transition)

      const handleMouseEnter = () => {
        const previous = previousElementState.get(element)
        if (!previous) return
        element.style.filter = appendDropShadow(
          previous.filter,
          HOVER_HIGHLIGHT_COLOR,
          8,
        )
      }

      const handleMouseLeave = () => {
        const previous = previousElementState.get(element)
        if (!previous) return
        if (previous.filter) {
          element.style.filter = previous.filter
        } else {
          element.style.removeProperty("filter")
        }
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

          if (previous.filter) {
            element.style.filter = previous.filter
          } else {
            element.style.removeProperty("filter")
          }

          if (previous.transition) {
            element.style.transition = previous.transition
          } else {
            element.style.removeProperty("transition")
          }
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
