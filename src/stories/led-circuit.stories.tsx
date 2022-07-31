import { createProjectBuilder } from "../lib/project"
import { ProjectComponent } from "../schematic-components/ProjectComponent"

export default {
  title: "LED Circuit",
  component: ProjectComponent,
}

export const Primary = () => (
  <ProjectComponent
    project={createProjectBuilder()
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
      .build()}
  />
)
