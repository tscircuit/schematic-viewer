import type {
  BaseManualEditEvent,
  EditSchematicComponentLocationEvent,
  ManualEditEvent,
} from "@tscircuit/props"

export type EditSchematicComponentLocationEventWithElement =
  EditSchematicComponentLocationEvent & {
    _element: SVGElement
  }

export type {
  BaseManualEditEvent,
  EditSchematicComponentLocationEvent,
  ManualEditEvent,
}
