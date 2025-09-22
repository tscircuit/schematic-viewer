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

  // Apply cursor styles and hover effects using CSS
  useEffect(() => {
    if (!svgDivRef.current || !enabled || !onClickComponent) return

    const svg = svgDivRef.current.querySelector("svg")
    if (!svg) return

    // Create a style element for component hover and cursor styles
    const styleId = "schematic-component-interaction-styles"
    let styleElement = document.getElementById(styleId) as HTMLStyleElement
    
    if (!styleElement) {
      styleElement = document.createElement("style")
      styleElement.id = styleId
      document.head.appendChild(styleElement)
    }

    // Add CSS rules for component interaction
    styleElement.textContent = `
      [data-circuit-json-type="schematic_component"] {
        cursor: pointer !important;
        transition: opacity 0.15s ease;
      }
      [data-circuit-json-type="schematic_component"]:hover {
        opacity: 0.8 !important;
        filter: brightness(1.1) !important;
      }
    `

    const svgDiv = svgDivRef.current
    svgDiv.addEventListener("dblclick", handleDoubleClick)

    return () => {
      svgDiv.removeEventListener("dblclick", handleDoubleClick)
      // Don't remove the style element here as other components might be using it
    }
  }, [svgDivRef, handleDoubleClick, enabled, onClickComponent])

  // Cleanup styles when component unmounts or is disabled
  useEffect(() => {
    return () => {
      if (!enabled || !onClickComponent) {
        const styleElement = document.getElementById("schematic-component-interaction-styles")
        if (styleElement) {
          styleElement.remove()
        }
      }
    }
  }, [enabled, onClickComponent])
}