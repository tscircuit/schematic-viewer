import { useEffect, useCallback } from "react"

interface UseComponentDoubleClickOptions {
  svgDivRef: React.RefObject<HTMLDivElement | null>
  onClickComponent?: (componentId: string) => void
  enabled: boolean
}

export const useComponentDoubleClick = ({
  svgDivRef,
  onClickComponent,
  enabled,
}: UseComponentDoubleClickOptions) => {
  const handleDoubleClick = useCallback(
    (event: Event) => {
      if (!enabled || !onClickComponent) return

      const target = event.target as Element
      if (!target) return

      // Find the schematic component group
      const componentGroup = target.closest(
        '[data-circuit-json-type="schematic_component"]',
      )
      if (!componentGroup) return

      const componentId = componentGroup.getAttribute(
        "data-schematic-component-id",
      )
      if (!componentId) return

      // Show alert for now as placeholder for editing dialog
      alert(`Double-clicked component: ${componentId}`)

      // Call the callback with the component ID
      onClickComponent(componentId)
    },
    [enabled, onClickComponent],
  )

  useEffect(() => {
    if (!svgDivRef.current || !enabled || !onClickComponent) return

    const svgDiv = svgDivRef.current
    svgDiv.addEventListener("dblclick", handleDoubleClick)

    return () => {
      svgDiv.removeEventListener("dblclick", handleDoubleClick)
    }
  }, [svgDivRef, handleDoubleClick, enabled, onClickComponent])

  // Return a function to add pointer cursor styles to components
  const addComponentCursor = useCallback(() => {
    if (!svgDivRef.current || !enabled || !onClickComponent) return

    const svg = svgDivRef.current.querySelector("svg")
    if (!svg) return

    // Add pointer cursor to all schematic components
    const components = svg.querySelectorAll(
      '[data-circuit-json-type="schematic_component"]',
    )
    components.forEach((component) => {
      ;(component as SVGElement).style.cursor = "pointer"
    })
  }, [svgDivRef, enabled, onClickComponent])

  return { addComponentCursor }
}