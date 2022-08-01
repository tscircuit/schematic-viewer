import * as Type from "lib/types"
import test from "ava"
import { createProjectBuilder, ProjectClass } from "lib/project"
import { applySelector } from "lib/apply-selector"

test("applySelector use css selector to select circuit elements", async (t) => {
  const project = new ProjectClass(
    createProjectBuilder()
      .addGroup((gb) =>
        gb
          .addComponent((cb) =>
            cb.setSourceProperties("simple_resistor", {
              resistance: "10 ohm",
              name: "R1",
            })
          )
          .addComponent((cb) =>
            cb.setSourceProperties("simple_capacitor", {
              name: "C1",
              capacitance: "10 uF",
            })
          )
      )
      .build()
  )
  const elements = project.getElements()
  const selector = ".R1 > port.right"

  t.deepEqual(applySelector(elements, selector), [
    {
      type: "source_port",
      name: "right",
      source_port_id: "source_port_1",
      source_component_id: "simple_resistor_0",
    },
  ])
})
