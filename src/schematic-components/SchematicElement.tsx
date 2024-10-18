import { AnyCircuitElement } from "circuit-json"
import { collectElementRefs } from "lib/utils/collect-element-refs"
import SchematicBox from "./SchematicBox"
import SchematicComponent from "./SchematicComponent"
import SchematicLine from "./SchematicLine"
import { SchematicNetLabel } from "./SchematicNetLabel"
import SchematicPath from "./SchematicPath"
import SchematicPort from "./SchematicPort"
import SchematicText from "./SchematicText"
import SchematicTrace from "./SchematicTrace"

/**
 * Render any @tsbuilder/builder AnyElement that can be put on a schematic.
 */
export const SchematicElement = ({
  element,
  allElements,
}: {
  element: AnyCircuitElement
  allElements: AnyCircuitElement[]
}) => {
  // A lot of the split logic for element types into a project is here:
  // https://github.com/tscircuit/builder/blob/7e7bef9c0aadd11999795003b8986f0d244c111f/src/lib/project/create-project-from-elements.ts#L13
  if (element.type === "schematic_component") {
    return (
      <SchematicComponent
        component={collectElementRefs(element, allElements) as any}
      />
    )
  }

  if (element.type === "schematic_trace") {
    return (
      <SchematicTrace trace={collectElementRefs(element, allElements) as any} />
    )
  }

  // if (element.type === "schematic_port") {
  //   return (
  //     <SchematicPort port={collectElementRefs(element, allElements) as any} />
  //   )
  // }

  if (element.type === "schematic_box") {
    return (
      <SchematicBox box={collectElementRefs(element, allElements) as any} />
    )
  }

  if (element.type === "schematic_line") {
    return (
      <SchematicLine line={collectElementRefs(element, allElements) as any} />
    )
  }

  if (element.type === "schematic_path") {
    return (
      <SchematicPath path={collectElementRefs(element, allElements) as any} />
    )
  }

  if (element.type === "schematic_text") {
    return <SchematicText schematic_text={element} />
  }

  if (element.type === "schematic_net_label") {
    return <SchematicNetLabel net_label={element} />
  }

  return null
}
