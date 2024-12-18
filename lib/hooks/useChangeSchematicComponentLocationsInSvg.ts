import type {
  ManualEditEvent,
  EditSchematicComponentLocationEventWithElement,
} from "lib/types/edit-events"
import { useEffect, useRef } from "react"

/**
 * This hook automatically applies the edit events to the schematic components
 * inside the svg div.
 *
 * Schematic components are "<g>" elements with a "data-circuit-json-type"
 * attribute equal to "schematic_component", these elements also have a
 * data-schematic-component-id attribute equal to the schematic_component_id
 */
export const useChangeSchematicComponentLocationsInSvg = (
  svgDivRef: React.RefObject<HTMLDivElement | null>,
  editEvents: ManualEditEvent[],
) => {
  // Keep track of the last known SVG content
  const lastSvgContentRef = useRef<string | null>(null)

  useEffect(() => {
    const svg = svgDivRef.current
    if (!svg) return

    // Create a MutationObserver to watch for changes in the div's content
    const observer = new MutationObserver((mutations) => {
      // Check if the SVG content has changed
      const currentSvgContent = svg.innerHTML
      if (currentSvgContent !== lastSvgContentRef.current) {
        lastSvgContentRef.current = currentSvgContent

        // Apply the transforms
        applyTransforms()
      }
    })

    // Function to apply transforms to components
    const applyTransforms = () => {
      // Reset all transforms
      const allComponents = svg.querySelectorAll(
        '[data-circuit-json-type="schematic_component"]',
      )
      allComponents.forEach((component) => {
        component.setAttribute("style", "")
      })

      // Apply transforms from edit events
      editEvents.forEach((editEvent) => {
        if (!("edit_event_type" in editEvent)) return
        if (editEvent.edit_event_type !== "edit_schematic_component_location")
          return

        const schematic_component_id = editEvent.schematic_component_id
        const component = svg.querySelector(
          `[data-schematic-component-id="${schematic_component_id}"]`,
        )

        if (!component) return

        const delta = {
          x: editEvent.new_center.x - editEvent.original_center.x,
          y: editEvent.new_center.y - editEvent.original_center.y,
        }

        component.setAttribute(
          "style",
          `transform: translate(${delta.x}px, ${delta.y}px)`,
        )
      })
    }

    // Start observing the div for changes
    observer.observe(svg, {
      childList: true, // Watch for changes to the child elements
      subtree: false, // Watch for changes in the entire subtree
      characterData: false, // Watch for changes to text content
    })

    // Apply transforms immediately on mount or when editEvents change
    applyTransforms()

    // Cleanup function
    return () => {
      observer.disconnect()
    }
  }, [svgDivRef, editEvents]) // Dependencies remain the same
}
