import { AnyCircuitElement, SourcePort } from "circuit-json"

export const collectElementRefs = (
  elm: AnyCircuitElement,
  allElms: AnyCircuitElement[]
) => {
  const source_port = allElms.find(
    (e) =>
      e.type === "source_port" &&
      e.source_port_id === (elm as any).source_port_id
  ) as SourcePort | null
  const source_component_id: string =
    (elm as any).source_component_id ?? source_port?.source_component_id
  const source_component = allElms.find(
    (e) =>
      e.type === "source_component" &&
      e.source_component_id === source_component_id
  )
  if (
    [
      "schematic_component",
      "schematic_trace",
      "schematic_port",
      "schematic_box",
      "schematic_line",
      "schematic_path",
    ].includes(elm.type)
  ) {
    const schematic_children = allElms.filter(
      (e) =>
        "schematic_component_id" in e &&
        e.schematic_component_id === (elm as any).schematic_component_id
    )

    return {
      schematic_children,
      schematic: elm,
      source: source_component,
      source_component,
      source_port,
    }
  }
  return null
}
