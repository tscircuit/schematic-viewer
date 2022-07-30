import { createProjectBuilder } from "lib/project"

export default createProjectBuilder()
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
          capacitance: "10 uF",
        })
      )
  )
  .build()
