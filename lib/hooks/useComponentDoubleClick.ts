import { useEffect, useCallback } from "react"

interface UseComponentDoubleClickOptions {
  svgDivRef: React.RefObject<HTMLDivElement | null>
  onClickComponent?: (componentId: string) => void
  enabled: boolean
  svgContent?: string // Add this to track when SVG changes
}

export const useComponentDoubleClick = ({
  svgDivRef,
  onClickComponent,
  enabled,
  svgContent,
}: UseComponentDoubleClickOptions) => {
  const handleDoubleClick = useCallback(
    (event: Event) => {
      console.log("Double-click event detected", event)
      
      if (!enabled || !onClickComponent) {
        console.log("Double-click handling disabled or no callback provided")
        return
      }

      const target = event.target as Element
      if (!target) {
        console.log("No target found")
        return
      }

      console.log("Target element:", target)

      // Find the schematic component group
      const componentGroup = target.closest(
        '[data-circuit-json-type="schematic_component"]',
      )
      
      console.log("Component group found:", componentGroup)
      
      if (!componentGroup) {
        console.log("No component group found")
        return
      }

      const componentId = componentGroup.getAttribute(
        "data-schematic-component-id",
      )
      
      console.log("Component ID:", componentId)
      
      if (!componentId) {
        console.log("No component ID found")
        return
      }

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
      if (!svg) {
        console.log("SVG not found in DOM")
        return
      }

      console.log("Setting up component interaction styles and event listeners")

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

      // Check if there are any components
      const components = svg.querySelectorAll('[data-circuit-json-type="schematic_component"]')
      console.log(`Found ${components.length} components`)
    }, 100) // Give more time for DOM to be ready

    const svgDiv = svgDivRef.current
    svgDiv.addEventListener("dblclick", handleDoubleClick)

    return () => {
      clearTimeout(timeoutId)
      svgDiv.removeEventListener("dblclick", handleDoubleClick)
    }
  }, [svgDivRef, handleDoubleClick, enabled, onClickComponent, svgContent])

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