import type { CircuitJson } from "circuit-json"

/** Stable identity for hosts to locate the component on their PCB. */
export interface ViewPcbComponentEvent {
  source_component_id: string
  schematic_component_id: string
  pcb_component_id: string
  refdes: string
}

export const getPcbComponentAtElement = (
  target: Element | null,
  circuitJson: CircuitJson,
): ViewPcbComponentEvent | undefined => {
  const componentId = target
    ?.closest("[data-schematic-component-id]")
    ?.getAttribute("data-schematic-component-id")
  const textId = target
    ?.closest("[data-schematic-text-id]")
    ?.getAttribute("data-schematic-text-id")
  const portId = target
    ?.closest("[data-schematic-port-id]")
    ?.getAttribute("data-schematic-port-id")
  if (!componentId && !textId && !portId) return
  const text = circuitJson.find(
    (element) =>
      element.type === "schematic_text" && element.schematic_text_id === textId,
  )
  const port = circuitJson.find(
    (element) =>
      element.type === "schematic_port" &&
      !!portId &&
      (element.schematic_port_id === portId ||
        element.source_port_id === portId),
  )
  const schematicComponentId =
    componentId ??
    (text?.type === "schematic_text"
      ? text.schematic_component_id
      : undefined) ??
    (port?.type === "schematic_port" ? port.schematic_component_id : undefined)
  if (!schematicComponentId) return

  const schematicComponent = circuitJson.find(
    (element) =>
      element.type === "schematic_component" &&
      element.schematic_component_id === schematicComponentId,
  )
  if (schematicComponent?.type !== "schematic_component") return
  const sourceComponent = circuitJson.find(
    (element) =>
      element.type === "source_component" &&
      element.source_component_id === schematicComponent.source_component_id,
  )
  const pcbComponent = circuitJson.find(
    (element) =>
      element.type === "pcb_component" &&
      element.source_component_id === schematicComponent.source_component_id,
  )
  if (
    sourceComponent?.type !== "source_component" ||
    pcbComponent?.type !== "pcb_component"
  )
    return

  return {
    source_component_id: sourceComponent.source_component_id,
    schematic_component_id: schematicComponent.schematic_component_id,
    pcb_component_id: pcbComponent.pcb_component_id,
    refdes: sourceComponent.name,
  }
}
