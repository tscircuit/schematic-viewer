import { AnyElement } from "@tscircuit/builder"
import { collectElementRefs } from "lib/utils/collect-element-refs"
import SchematicComponent from "./SchematicComponent"
import SchematicPort from "./SchematicPort"
import SchematicText from "./SchematicText"
import SchematicBox from "./SchematicBox"
import SchematicTrace from "./SchematicTrace"
import SchematicLine from "./SchematicLine"
import RenderError from "./RenderError"
import SchematicPath from "./SchematicPath"

/**
 * Render any @tsbuilder/builder AnyElement that can be put on a schematic.
 */
export const SchematicElement = ({
  element,
  allElements,
}: {
  element: AnyElement
  allElements: AnyElement[]
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

  if (element.type === "schematic_port") {
    return (
      <SchematicPort port={collectElementRefs(element, allElements) as any} />
    )
  }

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

  if (element.type === "source_error") {
    // TODO use the ids on the source error to put this in the right place
    return <RenderError text={element.message} />
  }

  return null
}
