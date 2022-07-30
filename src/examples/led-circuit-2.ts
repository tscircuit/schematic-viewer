import { createProjectBuilder } from "./../lib/project/index"

export default createProjectBuilder().addGroup((gb) =>
  gb.addComponent((cb) =>
    cb.setName("hi").setSourceProperties("simple_resistor", {
      resistance: 1,
    })
  )
)
