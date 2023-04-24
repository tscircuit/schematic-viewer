import { AnyElement } from "@tscircuit/builder"

export const collectElementRefs = (elm: AnyElement, allElms: AnyElement[]) => {
  const source_component = allElms.find(
    (e) =>
      e.type === "source_component" &&
      e.source_component_id === (elm as any).source_component_id
  )
  if (elm.type === "schematic_component") {
    return {
      schematic: elm,
      source: source_component,
    }
  }

  if (elm.type === "schematic_trace") {
  }

  return null
}
