import type { CircuitJson } from "circuit-json"

/** Stable identity for hosts to locate the component on their PCB. */
export interface ViewPcbComponentEvent {
  source_component_id: string
  schematic_component_id: string
  pcb_component_id: string
  refdes: string
}

export const getSchematicComponentAtElement = (
  target: Element | null,
  circuitJson: CircuitJson,
) => {
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
  if (schematicComponentId) {
    const schematicComponent = circuitJson.find(
      (element) =>
        element.type === "schematic_component" &&
        element.schematic_component_id === schematicComponentId,
    )
    if (schematicComponent?.type === "schematic_component") {
      return schematicComponent
    }
  }

  const sourcePortId =
    port?.type === "schematic_port" ? port.source_port_id : portId
  if (!sourcePortId) return
  const sourcePort = circuitJson.find(
    (element) =>
      element.type === "source_port" && element.source_port_id === sourcePortId,
  )
  if (sourcePort?.type !== "source_port" || !sourcePort.source_component_id)
    return

  const portSheetId =
    port?.type === "schematic_port" ? port.schematic_sheet_id : undefined
  const schematicComponent =
    circuitJson.find(
      (element) =>
        element.type === "schematic_component" &&
        element.source_component_id === sourcePort.source_component_id &&
        (!portSheetId || element.schematic_sheet_id === portSheetId),
    ) ??
    circuitJson.find(
      (element) =>
        element.type === "schematic_component" &&
        element.source_component_id === sourcePort.source_component_id,
    )
  if (schematicComponent?.type !== "schematic_component") return
  return schematicComponent
}

export const getPcbComponentAtElement = (
  target: Element | null,
  circuitJson: CircuitJson,
): ViewPcbComponentEvent | undefined => {
  const schematicComponent = getSchematicComponentAtElement(target, circuitJson)
  if (!schematicComponent) return
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
