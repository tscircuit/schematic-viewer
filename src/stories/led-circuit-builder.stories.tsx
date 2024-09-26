import { useMaybePromise } from "lib/hooks"
import { Schematic } from "../Schematic"
import { createProjectBuilder } from "@tscircuit/builder"

const pb = createProjectBuilder()
const $soup = pb
  .addGroup((gb) =>
    gb
      .addResistor((rb) =>
        rb
          .setSourceProperties({
            resistance: "10 ohm",
            name: "R1",
          })
          .setSchematicCenter(2, 1)
      )
      .addCapacitor((cb) =>
        cb
          .setSourceProperties({
            name: "C1",
            capacitance: "10 uF",
          })
          .setSchematicCenter(4, 2)
          .setSchematicRotation("90deg")
      )
      .addResistor((cb) =>
        cb
          .setSourceProperties({
            resistance: "10 ohm",
            name: "R2",
          })
          .setSchematicCenter(6, 1)
          .setSchematicRotation("90deg")
      )
      .addTrace([".R1 > port.right", ".C1 > port.left", ".R2 > port.left"])
      .addPowerSource((cb) =>
        cb
          .setSourceProperties({
            voltage: "5V",
            name: "main_power",
          })
          .setSchematicCenter(1, 2)
      )
      .addTrace(["power > port.positive", ".R1 > port.left"])
      .addTrace([
        "power > port.negative",
        ".C1 > port.right",
        ".R2 > port.right",
      ])
      .addBug((cb) =>
        cb
          .setSourceProperties({ name: "B1" })
          .setSchematicProperties({
            port_arrangement: {
              left_size: 3,
              right_size: 3,
            },
          })
          .labelPort(1, "PWR")
          .labelPort(2, "NC")
          .labelPort(3, "RG")
          .labelPort(4, "D0")
          .labelPort(5, "D1")
          .labelPort(6, "GND")
          .setSchematicCenter(8, 3)
      )
      .addTrace([".B1 > port.PWR", ".R2 > port.left"])
      .addGround((cb) =>
        cb
          .setSourceProperties({
            name: "GND",
          })
          .setSchematicCenter(11, 3)
      )
      .addTrace([".B1 > port.GND", ".gnd"])
      .addDiode((db) =>
        db
          .setSourceProperties({ name: "D1" })
          .setSchematicCenter(6, 3.5)
          .setSchematicRotation("180deg")
      )
      .addTrace([".D1 > .left", ".B1 > .RG"])
      .addTrace([".D1 > .right", ".C1 > .right"])
      .add("net_alias", (nab) =>
        nab
          .setSourceProperties({
            net: "D0BUS",
          })
          .setSchematicCenter("10mm", "1mm")
      )
      .addTrace([".D0BUS", ".B1 > .D0"])
  )
  .build(pb.createBuildContext())

export const LEDCircuitBuilder = () => {
  const soup = useMaybePromise($soup)
  if (!soup) return null
  return <Schematic style={{ height: 600 }} soup={soup as any} />
}

export default {
  title: "LEDCircuitBuilder",
  component: LEDCircuitBuilder,
}
