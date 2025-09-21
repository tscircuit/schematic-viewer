
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
  const highlightRef = useRef<SVGRectElement | null>(null)

  useEffect(() => {
    const svgContainer = svgDivRef.current
    if (!svgContainer || !onClickComponent) return

    const svg = svgContainer.querySelector("svg")
    if (!svg) return

    const shouldEnableInteraction = !((clickToInteractEnabled && !isInteractionEnabled) || showSpiceOverlay)

  const componentSelector = '[data-circuit-json-type="schematic_component"]'
    
    const findComponentGroup = (target: Element | null): HTMLElement | null => {
      return target?.closest(componentSelector) as HTMLElement | null
    }

    const handleDoubleClick = (event: MouseEvent) => {
      if (!shouldEnableInteraction) return

      const componentGroup = findComponentGroup(event.target as Element)
      if (!componentGroup) return

      const schematicComponentId = componentGroup.getAttribute("data-schematic-component-id")
      if (!schematicComponentId) return

      onClickComponent({ schematicComponentId, event })
    }

    // Ensure a single persistent highlight rect exists
    if (!highlightRef.current) {
      const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect")
      rect.setAttribute("fill", "rgba(0, 100, 255, 0.2)")
      rect.setAttribute("stroke", "rgba(0, 100, 255, 0.5)")
      rect.setAttribute("stroke-width", "0.05")
      rect.setAttribute("rx", "0.1")
      rect.setAttribute("ry", "0.1")
      rect.style.pointerEvents = "none"
      rect.style.display = "none"
      svg.appendChild(rect)
      highlightRef.current = rect
    }

    const handleMouseEnter = (event: MouseEvent) => {
      if (!shouldEnableInteraction) return

      const target = event.currentTarget as Element
      const rect = highlightRef.current
      if (!rect || !("getBBox" in target)) return

      const bbox = (target as unknown as SVGGraphicsElement).getBBox()
      rect.setAttribute("x", bbox.x.toString())
      rect.setAttribute("y", bbox.y.toString())
      rect.setAttribute("width", bbox.width.toString())
      rect.setAttribute("height", bbox.height.toString())
      rect.style.display = ""
    }

    const handleMouseLeave = (event: MouseEvent) => {
      const rect = highlightRef.current
      if (!rect) return

      const related = event.relatedTarget as Element | null
      if (related?.closest(componentSelector)) return
      rect.style.display = "none"
    }

    const componentElements = Array.from(
      svgContainer.querySelectorAll(componentSelector)
    ) as HTMLElement[]

    if (shouldEnableInteraction) {
      componentElements.forEach((element) => {
        previousCursorMap.current.set(element, element.style.cursor || null)
        element.style.cursor = "pointer"
        element.addEventListener("mouseenter", handleMouseEnter, { passive: true })
        element.addEventListener("mouseleave", handleMouseLeave, { passive: true })
      })
    }

    svgContainer.addEventListener("dblclick", handleDoubleClick)

    return () => {
      svgContainer.removeEventListener("dblclick", handleDoubleClick)
      // remove persistent rect
      if (highlightRef.current) {
        highlightRef.current.remove()
        highlightRef.current = null
      }

      componentElements.forEach((element) => {
        element.removeEventListener("mouseenter", handleMouseEnter)
        element.removeEventListener("mouseleave", handleMouseLeave)
        
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
