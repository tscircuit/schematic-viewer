
import { useEffect, useRef } from "react"

interface UseComponentDoubleClickProps {
  svgDivRef: React.RefObject<HTMLDivElement | null>
  svgString: string
  onClickComponent?: (args: {
    schematicComponentId: string
    event: MouseEvent
  }) => void
  clickToInteractEnabled: boolean
  isInteractionEnabled: boolean
  showSpiceOverlay: boolean
}

export const useComponentDoubleClick = ({
  svgDivRef,
  svgString,
  onClickComponent,
  clickToInteractEnabled,
  isInteractionEnabled,
  showSpiceOverlay,
}: UseComponentDoubleClickProps) => {
  const previousCursorMap = useRef(new Map<HTMLElement, string | null>())

  useEffect(() => {
    const svgContainer = svgDivRef.current
    if (!svgContainer || !onClickComponent) return

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

    const handleMouseOver = (event: MouseEvent) => {
      const target = event.target as Element | null
      const componentGroup = target?.closest(
        '[data-circuit-json-type="schematic_component"]',
      ) as HTMLElement | null

      if (componentGroup) {
        const rect = componentGroup.getBoundingClientRect()
        const svgRect = svgContainer.getBoundingClientRect()
        const highlight = document.createElement("div")
        highlight.style.position = "absolute"
        highlight.style.left = `${rect.left - svgRect.left}px`
        highlight.style.top = `${rect.top - svgRect.top}px`
        highlight.style.width = `${rect.width}px`
        highlight.style.height = `${rect.height}px`
        highlight.style.backgroundColor = "rgba(0, 100, 255, 0.2)"
        highlight.style.border = "1px solid rgba(0, 100, 255, 0.5)"
        highlight.style.borderRadius = "2px"
        highlight.style.pointerEvents = "none"
        highlight.classList.add("component-hover-highlight")
        svgContainer.appendChild(highlight)
      }
    }

    const handleMouseOut = (event: MouseEvent) => {
      const highlight = svgContainer.querySelector(".component-hover-highlight")
      if (highlight) {
        highlight.remove()
      }
    }

    svgContainer.addEventListener("dblclick", handleDoubleClick)
    svgContainer.addEventListener("mouseover", handleMouseOver)
    svgContainer.addEventListener("mouseout", handleMouseOut)

    const componentElements = Array.from(
      svgContainer.querySelectorAll(
        '[data-circuit-json-type="schematic_component"]',
      ),
    ) as HTMLElement[]

    componentElements.forEach((element) => {
      previousCursorMap.current.set(element, element.style.cursor || null)
      element.style.cursor = "pointer"
    })

    return () => {
      svgContainer.removeEventListener("dblclick", handleDoubleClick)
      svgContainer.removeEventListener("mouseover", handleMouseOver)
      svgContainer.removeEventListener("mouseout", handleMouseOut)
      const highlight = svgContainer.querySelector(".component-hover-highlight")
      if (highlight) {
        highlight.remove()
      }
      componentElements.forEach((element) => {
        const previousCursor = previousCursorMap.current.get(element)
        if (previousCursor) {
          element.style.cursor = previousCursor
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
  ])
}
