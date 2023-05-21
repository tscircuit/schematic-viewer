import { AnyElement } from "@tscircuit/builder"

export const collectElementRefs = (elm: AnyElement, allElms: AnyElement[]) => {
  const source_component = allElms.find(
    (e) =>
      e.type === "source_component" &&
      e.source_component_id === (elm as any).source_component_id
  )
  if (
    ["schematic_component", "schematic_trace", "schematic_port"].includes(
      elm.type
    )
  ) {
    return {
      schematic: elm,
      source: source_component,
    }
  }
  return null
}
