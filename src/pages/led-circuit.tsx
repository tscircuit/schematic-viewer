import { createProjectBuilder } from "../lib/project"
import { ProjectComponent } from "../schematic-components/ProjectComponent"

export default () => {
  return (
    <ProjectComponent
      project={createProjectBuilder()
        .addGroup((gb) =>
          gb
            .addComponent((cb) =>
              cb
                .setSourceProperties("simple_resistor", {
                  resistance: "10 ohm",
                  name: "R1",
                })
                .setSchematicCenter(2, 1)
            )
            .addComponent((cb) =>
              cb
                .setSourceProperties("simple_capacitor", {
                  name: "C1",
                  capacitance: "10 uF",
                })
                .setSchematicCenter(4, 1)
            )
            .addComponent((cb) =>
              cb
                .setSourceProperties("simple_resistor", {
                  resistance: "10 ohm",
                  name: "R1",
                })
                .setSchematicCenter(6, 1)
                .setSchematicRotation("90deg")
            )
        )
        .build()}
    />
  )
}
