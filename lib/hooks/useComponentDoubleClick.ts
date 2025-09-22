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

    const svgDiv = svgDivRef.current

    // Function to setup styles when SVG is ready
    const setupStyles = () => {
      const svg = svgDiv.querySelector("svg")
      if (!svg) return false

      // Check if styles are already applied to this SVG
      if (svg.hasAttribute("data-svg-id")) {
        return true // Already setup
      }

      // Generate a unique ID for this SVG instance (only once)
      const svgId = `svg-${Math.random().toString(36).substr(2, 9)}`
      svg.setAttribute("data-svg-id", svgId)

      // Create a style element scoped to this specific SVG
      const styleId = `schematic-component-styles-${svgId}`
      const styleElement = document.createElement("style")
      styleElement.id = styleId
      document.head.appendChild(styleElement)

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
      return true
    }

    // Try to setup immediately
    if (!setupStyles()) {
      // If SVG not ready, use MutationObserver to wait for it
      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            if (setupStyles()) {
              observer.disconnect()
              break
            }
          }
        }
      })

      observer.observe(svgDiv, { childList: true, subtree: true })
      
      // Cleanup observer after 5 seconds if no SVG found
      const timeoutId = setTimeout(() => observer.disconnect(), 5000)
      
      // Add cleanup for observer
      const originalCleanup = () => {
        clearTimeout(timeoutId)
        observer.disconnect()
        svgDiv.removeEventListener("dblclick", handleDoubleClick)
        
        // Clean up styles
        const svg = svgDiv.querySelector("svg")
        if (svg) {
          const styleId = svg.getAttribute("data-style-id")
          if (styleId) {
            const styleElement = document.getElementById(styleId)
            if (styleElement) {
              styleElement.remove()
            }
            svg.removeAttribute("data-svg-id")
            svg.removeAttribute("data-style-id")
          }
        }
      }
      
      svgDiv.addEventListener("dblclick", handleDoubleClick)
      return originalCleanup
    }

    // Add event listener
    svgDiv.addEventListener("dblclick", handleDoubleClick)

    return () => {
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
          svg.removeAttribute("data-svg-id")
          svg.removeAttribute("data-style-id")
        }
      }
    }
  }, [svgDivRef, handleDoubleClick, enabled, onClickComponent])
}
