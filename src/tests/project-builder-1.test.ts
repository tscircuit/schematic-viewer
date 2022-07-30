import { createProjectBuilder } from "lib/project"
import test from "ava"

test("create basic circuit", (t) => {
  const project = createProjectBuilder()
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
  t.snapshot(project)
})
