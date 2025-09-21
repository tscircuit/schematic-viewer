
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

    const svg = svgContainer.querySelector("svg")
    if (!svg) return

    const shouldEnableInteraction = !((clickToInteractEnabled && !isInteractionEnabled) || showSpiceOverlay)

    const findComponentGroup = (target: Element | null): HTMLElement | null => {
      return target?.closest('[data-circuit-json-type="schematic_component"]') as HTMLElement | null
    }

    const handleDoubleClick = (event: MouseEvent) => {
      if (!shouldEnableInteraction) return

      const componentGroup = findComponentGroup(event.target as Element)
      if (!componentGroup) return

      const schematicComponentId = componentGroup.getAttribute("data-schematic-component-id")
      if (!schematicComponentId) return

      onClickComponent({ schematicComponentId, event })
    }

    const removeExistingHighlight = () => {
      svg.querySelector(".component-hover-highlight")?.remove()
    }

    const createHighlight = (componentGroup: SVGGraphicsElement) => {
      const bbox = componentGroup.getBBox()
      const highlight = document.createElementNS("http://www.w3.org/2000/svg", "rect")
      
      highlight.setAttribute("x", bbox.x.toString())
      highlight.setAttribute("y", bbox.y.toString())
      highlight.setAttribute("width", bbox.width.toString())
      highlight.setAttribute("height", bbox.height.toString())
      highlight.setAttribute("fill", "rgba(0, 100, 255, 0.2)")
      highlight.setAttribute("stroke", "rgba(0, 100, 255, 0.5)")
      highlight.setAttribute("stroke-width", "0.05")
      highlight.setAttribute("rx", "0.1")
      highlight.setAttribute("ry", "0.1")
      highlight.style.pointerEvents = "none"
      highlight.classList.add("component-hover-highlight")
      svg.appendChild(highlight)
    }

    const handleMouseEnter = (event: MouseEvent) => {
      if (!shouldEnableInteraction || svg.querySelector(".component-hover-highlight")) return

      const componentGroup = findComponentGroup(event.target as Element)
      if (componentGroup && "getBBox" in componentGroup) {
        createHighlight(componentGroup as unknown as SVGGraphicsElement)
      }
    }

    const componentElements = Array.from(
      svgContainer.querySelectorAll('[data-circuit-json-type="schematic_component"]')
    ) as HTMLElement[]

    if (shouldEnableInteraction) {
      componentElements.forEach((element) => {
        previousCursorMap.current.set(element, element.style.cursor || null)
        element.style.cursor = "pointer"
        element.addEventListener("mouseenter", handleMouseEnter)
        element.addEventListener("mouseleave", removeExistingHighlight)
      })
    }

    svgContainer.addEventListener("dblclick", handleDoubleClick)

    return () => {
      svgContainer.removeEventListener("dblclick", handleDoubleClick)
      removeExistingHighlight()

      componentElements.forEach((element) => {
        element.removeEventListener("mouseenter", handleMouseEnter)
        element.removeEventListener("mouseleave", removeExistingHighlight)
        
        const previousCursor = previousCursorMap.current.get(element)
        if (previousCursor) {
          element.style.cursor = previousCursor
        } else {
          element.style.removeProperty("cursor")
        }
      })
      
      previousCursorMap.current.clear()
    }
  }, [
    svgString,
    onClickComponent,
    clickToInteractEnabled,
    isInteractionEnabled,
    showSpiceOverlay,
  ])
}
