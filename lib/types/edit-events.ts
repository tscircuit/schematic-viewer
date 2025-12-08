import type {
  EditSchematicComponentLocationEvent,
  ManualEditEvent,
} from "@tscircuit/props"

export type EditSchematicComponentLocationEventWithElement =
  EditSchematicComponentLocationEvent & {
    _element: SVGElement
  }

export type { EditSchematicComponentLocationEvent, ManualEditEvent }
