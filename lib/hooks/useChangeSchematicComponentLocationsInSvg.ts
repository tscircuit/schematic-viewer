import { su } from "@tscircuit/soup-util"
import type {
  ManualEditEvent,
  EditSchematicComponentLocationEventWithElement,
} from "lib/types/edit-events"
import { type Matrix, compose, applyToPoint } from "transformation-matrix"
import { useEffect, useRef } from "react"
import { getComponentOffsetDueToEvents } from "lib/utils/get-component-offset-due-to-events"
import type { CircuitJson } from "circuit-json"

/**
 * This hook automatically applies the edit events to the schematic components
 * inside the svg div.
 *
 * Schematic components are "<g>" elements with a "data-circuit-json-type"
 * attribute equal to "schematic_component", these elements also have a
 * data-schematic-component-id attribute equal to the schematic_component_id
 */
export const useChangeSchematicComponentLocationsInSvg = ({
  svgDivRef,
  realToSvgProjection,
  svgToScreenProjection,
  activeEditEvent,
  editEvents,
}: {
  svgDivRef: React.RefObject<HTMLDivElement | null>
  realToSvgProjection: Matrix
  svgToScreenProjection: Matrix
  activeEditEvent: EditSchematicComponentLocationEventWithElement | null
  editEvents: ManualEditEvent[]
}) => {
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
      const componentsThatHaveBeenMoved = new Set<string>()
      for (const event of editEvents) {
        if (
          "edit_event_type" in event &&
          event.edit_event_type === "edit_schematic_component_location"
        ) {
          componentsThatHaveBeenMoved.add(event.schematic_component_id)
        }
      }

      // Reset all transforms
      const allComponents = svg.querySelectorAll(
        '[data-circuit-json-type="schematic_component"]',
      )

      for (const component of Array.from(allComponents)) {
        const schematic_component_id = component.getAttribute(
          "data-schematic-component-id",
        )!

        if (!componentsThatHaveBeenMoved.has(schematic_component_id)) {
          component.setAttribute("style", "")
          continue
        }

        const offsetMm = getComponentOffsetDueToEvents({
          editEvents: [
            ...editEvents,
            ...(activeEditEvent ? [activeEditEvent] : []),
          ],
          schematic_component_id,
        })

        const offsetPx = {
          x: offsetMm.x * realToSvgProjection.a,
          y: offsetMm.y * realToSvgProjection.d,
        }

        component.setAttribute(
          "style",
          `transform: translate(${offsetPx.x}px, ${offsetPx.y}px)`,
        )
      }
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
  }, [svgDivRef, editEvents, activeEditEvent]) // Dependencies remain the same
}
