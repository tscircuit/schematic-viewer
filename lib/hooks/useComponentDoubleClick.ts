import { useEffect, useCallback } from "react"

interface UseComponentDoubleClickOptions {
  svgDivRef: React.RefObject<HTMLDivElement | null>
  onClickComponent?: (componentId: string) => void
  enabled: boolean
  svgContent?: string 
}

export const useComponentDoubleClick = ({
  svgDivRef,
  onClickComponent,
  enabled,
  svgContent,
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

    // Add a small delay to ensure SVG is rendered
    const timeoutId = setTimeout(() => {
      const svg = svgDivRef.current?.querySelector("svg")
      if (!svg) return

      // Generate a unique ID for this SVG instance
      const svgId = `svg-${Math.random().toString(36).substr(2, 9)}`
      svg.setAttribute("data-svg-id", svgId)

      // Create a style element scoped to this specific SVG
      const styleId = `schematic-component-styles-${svgId}`
      let styleElement = document.getElementById(styleId) as HTMLStyleElement

      if (!styleElement) {
        styleElement = document.createElement("style")
        styleElement.id = styleId
        document.head.appendChild(styleElement)
      }

      // Add CSS rules scoped to this specific SVG instance
      styleElement.textContent = `
        [data-svg-id="${svgId}"] [data-circuit-json-type="schematic_component"] {
          cursor: pointer !important;
          transition: opacity 0.15s ease;
        }
        [data-svg-id="${svgId}"] [data-circuit-json-type="schematic_component"]:hover {
          opacity: 0.8 !important;
          filter: brightness(1.1) !important;
        }
      `

      // Store the style element ID for cleanup
      svg.setAttribute("data-style-id", styleId)
    }, 100) // Give time for DOM to be ready

    const svgDiv = svgDivRef.current
    svgDiv.addEventListener("dblclick", handleDoubleClick)

    return () => {
      clearTimeout(timeoutId)
      svgDiv.removeEventListener("dblclick", handleDoubleClick)
      
      // Clean up the scoped styles
      const svg = svgDiv.querySelector("svg")
      if (svg) {
        const styleId = svg.getAttribute("data-style-id")
        if (styleId) {
          const styleElement = document.getElementById(styleId)
          if (styleElement) {
            styleElement.remove()
          }
        }
      }
    }
  }, [svgDivRef, handleDoubleClick, enabled, onClickComponent, svgContent])
}
