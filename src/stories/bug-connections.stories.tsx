import { Schematic } from "Schematic"

export const BugConnections = () => {
  return (
    <Schematic style={{ height: 600 }}>
      <board width="40mm" height="25mm" schAutoLayoutEnabled>
        <chip
          name="U1"
          footprint="soic8"
          pcbX="-10mm"
          pcbY="0mm"
          pinLabels={{
            1: "OUT1",
            2: "OUT2",
            3: "OUT3",
            4: "OUT4",
            5: "VCC",
            6: "IN1",
            7: "IN2",
            8: "GND",
          }}
          schPortArrangement={{
            leftSide: {
              pins: [1, 2, 3, 4],
              direction: "top-to-bottom",
            },
            rightSide: {
              pins: [5, 6, 7, 8],
              direction: "top-to-bottom",
            },
          }}
        />

        <diode name="D1" footprint="sod123" pcbX="-5mm" pcbY="5mm" />
        <diode name="D2" footprint="sod123" pcbX="-5mm" pcbY="-5mm" />
        <capacitor
          name="C1"
          footprint="0805"
          pcbX="5mm"
          pcbY="5mm"
          capacitance="100nF"
        />
        <capacitor
          name="C2"
          footprint="0805"
          pcbX="5mm"
          pcbY="-5mm"
          capacitance="100nF"
        />

        <trace from=".U1 .VCC" to=".C1 .pin1" />
        <trace from=".C1 .pin2" to=".C2 .pin1" />
        <trace from=".C2 .pin2" to="net.GND" />
        <trace from=".U1 .OUT1" to=".D1 .pin1" />
        <trace from=".D1 .pin2" to="net.MOUT1" />
        <trace from=".U1 .OUT2" to=".D2 .pin1" />
        <trace from=".D2 .pin2" to="net.MOUT2" />
      </board>
    </Schematic>
  )
}

export default {
  title: "BugConnections",
  component: BugConnections,
}
