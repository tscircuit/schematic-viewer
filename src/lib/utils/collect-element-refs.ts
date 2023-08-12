import { AnyElement } from "@tscircuit/builder"

export const collectElementRefs = (elm: AnyElement, allElms: AnyElement[]) => {
  const source_component = allElms.find(
    (e) =>
      e.type === "source_component" &&
      e.source_component_id === (elm as any).source_component_id
  )
  if (
    [
      "schematic_component",
      "schematic_trace",
      "schematic_port",
      "schematic_box",
      "schematic_line",
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
    }
  }
  return null
}
