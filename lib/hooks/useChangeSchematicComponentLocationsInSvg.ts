import type {
  ManualEditEvent,
  EditSchematicComponentLocationEventWithElement,
} from "lib/types/edit-events"
import { useEffect } from "react"

/*
edit_event_type: "edit_schematic_component_location";
schematic_component_id: string;
original_center: {
    x: number;
    y: number;
};
new_center: {
    x: number;
    y: number;
};
*/

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
  useEffect(() => {
    const svg = svgDivRef.current
    if (!svg) return

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

      const componentId = editEvent.schematic_component_id
      const component = svg.querySelector(
        `[data-schematic-component-id="${componentId}"]`,
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
  }, [svgDivRef, editEvents])
}
