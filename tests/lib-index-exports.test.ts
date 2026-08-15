import { expect, test } from "bun:test"
import * as packageExports from "../lib/index"

test("exports ControlledSchematicViewer from the package entry point", () => {
  expect(packageExports.ControlledSchematicViewer).toBeDefined()
  expect(typeof packageExports.ControlledSchematicViewer).toBe("function")
})

test("exports the full expected public API surface", () => {
  expect(Object.keys(packageExports).sort()).toEqual(
    [
      "AnalogSimulationViewer",
      "ControlledSchematicViewer",
      "MouseTracker",
      "SchematicViewer",
      "useMouseEventsOverBoundingBox",
    ].sort(),
  )
})
