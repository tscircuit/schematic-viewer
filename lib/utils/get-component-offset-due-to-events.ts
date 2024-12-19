import type {
  EditSchematicComponentLocationEvent,
  EditSchematicComponentLocationEventWithElement,
  ManualEditEvent,
} from "lib/types/edit-events"

/**
 * Returns the total offset of a component due to a set of edit events in
 * mm
 */
export const getComponentOffsetDueToEvents = ({
  editEvents,
  schematic_component_id,
}: {
  editEvents: ManualEditEvent[]
  schematic_component_id: string
}) => {
  const editEventsForComponent: EditSchematicComponentLocationEvent[] =
    editEvents
      .filter(
        (event) =>
          "schematic_component_id" in event &&
          event.schematic_component_id === schematic_component_id,
      )
      .filter(
        (event) =>
          "edit_event_type" in event &&
          event.edit_event_type === "edit_schematic_component_location",
      )

  const totalOffsetX = editEventsForComponent.reduce((acc, event) => {
    return acc + event.new_center.x - event.original_center.x
  }, 0)

  const totalOffsetY = editEventsForComponent.reduce((acc, event) => {
    return acc + event.new_center.y - event.original_center.y
  }, 0)

  return {
    x: totalOffsetX,
    y: totalOffsetY,
  }
}
