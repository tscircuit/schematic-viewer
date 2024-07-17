import { AnySoupElement } from "@tscircuit/soup"
import { collectElementRefs } from "lib/utils/collect-element-refs"
import SchematicComponent from "./SchematicComponent"
import SchematicPort from "./SchematicPort"
import SchematicText from "./SchematicText"
import { SchematicText as SchematicTextType } from "@tscircuit/soup"
import SchematicBox from "./SchematicBox"
import SchematicTrace from "./SchematicTrace"
import SchematicLine from "./SchematicLine"
import RenderError from "./RenderError"
import SchematicPath from "./SchematicPath"
import { SchematicNetLabel } from "./SchematicNetLabel"
import SVGPathComponent2 from "./SVGPathComponent2"
import { Type } from "@tscircuit/react-fiber/dist/lib/render"

/**
 * Render any @tsbuilder/builder AnyElement that can be put on a schematic.
 */
export const SchematicElement = ({
  element,
  allElements,
}: {
  element: AnySoupElement
  allElements: AnySoupElement[]
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

  if (element.type === "schematic_net_label") {
    return <SchematicNetLabel net_label={element} />
  }

  if (element.type === "source_error") {
    // TODO use the ids on the source error to put this in the right place
    return <RenderError text={element.message} />
  }

  if (element.ftype === "simple_bug") {
    const obj: SchematicTextType = {
      type: "schematic_text",
      schematic_component_id: "schematic_component_simple_bug_0",
      schematic_text_id: "schematic_text_0",
      anchor: "top",
      position: {
        x: -0.5,
        y: 1,
      },
      text: element.name,
      rotation: 0,
    }
    return <SchematicText schematic_text={obj} />
  }

  return null
}
