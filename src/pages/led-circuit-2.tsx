import { createProjectBuilder } from "../lib/project"
import { ProjectComponent } from "../schematic-components/ProjectComponent"

export default () => {
  return (
    <ProjectComponent
      project={createProjectBuilder()
        .addGroup(
          (gb) =>
            gb.addResistor((rb) =>
              rb
                .setSourceProperties({
                  resistance: "10 ohm",
                  name: "R1",
                })
                .setSchematicCenter(2, 1)
            )
          //     .addComponent((cb) =>
          //       cb
          //         .setSourceProperties("simple_capacitor", {
          //           name: "C1",
          //           capacitance: "10 uF",
          //         })
          //         .setSchematicCenter(4, 2)
          //         .setSchematicRotation("90deg")
          //     )
          //     .addComponent((cb) =>
          //       cb
          //         .setSourceProperties("simple_resistor", {
          //           resistance: "10 ohm",
          //           name: "R2",
          //         })
          //         .setSchematicCenter(6, 1)
          //         .setSchematicRotation("90deg")
          //     )
          //     .addRoute([
          //       ".R1 > port.right",
          //       ".C1 > port.left",
          //       ".R2 > port.left",
          //     ])
          //     .addComponent((cb) =>
          //       cb
          //         .setSourceProperties("simple_power_source", {
          //           voltage: "5V",
          //           name: "power",
          //         })
          //         .setSchematicCenter(1, 2)
          //     )
          //     .addRoute(["power > port.positive", ".R1 > port.left"])
          //     .addRoute([
          //       "power > port.negative",
          //       ".C1 > port.right",
          //       ".R2 > port.right",
          //     ])
          //     .addComponent((cb) =>
          //       cb
          //         .setSourceProperties("simple_bug", {
          //           name: "B1",
          //         })
          //         .setSchematicProperties({
          //           port_arrangement: {
          //             left_size: 3,
          //             right_size: 3,
          //           },
          //         })
          //         .labelPort(1, "PWR")
          //         .labelPort(2, "NC")
          //         .labelPort(3, "RG")
          //         .labelPort(4, "D0")
          //         .labelPort(5, "D1")
          //         .labelPort(6, "GND")
          //         .setSchematicCenter(8, 3)
          //     )
          //     .addRoute([".B1 > port.PWR", ".R2 > port.left"])
          //     .addComponent((cb) =>
          //       cb
          //         .setSourceProperties("simple_ground", {
          //           name: "GND",
          //         })
          //         .setSchematicCenter(11, 3)
          //     )
          //     .addRoute([".B1 > port.GND", ".gnd"])
        )
        .build()}
    />
  )
}
