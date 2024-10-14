import { Circuit } from "@tscircuit/core"
import { Schematic } from "Schematic"

export const BugHighPortNumbers = () => {
  const circuit = new Circuit()

  circuit.add(
    <group>
      <bug
        name="U1"
        manufacturerPartNumber="part-number"
        schPortArrangement={{
          leftSide: {
            pins: [16, 15, 20, 17, 4, 27, 28, 19, 26, 25, 7, 18, 21],
            direction: "top-to-bottom",
          },
          rightSide: {
            pins: [1, 5, 11, 3, 2, 9, 10, 6, 23, 22, 14, 13, 12],
            direction: "top-to-bottom",
          },
        }}
        footprint="ssop28Db"
        pinLabels={{
          "1": "TXD",
          "5": "RXD",
          "11": "CTS",
          "3": "RTS",
          "2": "DTR",
          "9": "DSR",
          "10": "DCD",
          "6": "RI",
          "23": "TXLED",
          "22": "RXLED",
          "14": "PWRUN",
          "13": "TXDEN",
          "12": "SLEEP",
          "16": "USBDM",
          "15": "USBDP",
          "20": "VCC",
          "17": "3V3OUT",
          "4": "VCCIO",
          "27": "OSCI",
          "28": "OSCO",
          "19": "RESET",
          "26": "TEST",
          "25": "AGND",
          "7": "GND7",
          "18": "GND18",
          "21": "GND21",
        }}
      />
      <resistor
        resistance="1kohm"
        name="R1"
        footprint="0805"
        schX={3}
        schY={0}
        schRotation="90deg"
      />
      <resistor
        resistance="1kohm"
        name="R2"
        footprint="0805"
        schX={4.5}
        schY={0}
        schRotation="90deg"
      />
      <diode
        name="LED1"
        footprint="0805"
        schRotation={"90deg"}
        schX={3}
        schY={2}
      />
      <diode
        name="LED2"
        footprint="0805"
        schRotation={"90deg"}
        schX={4.5}
        schY={2}
      />
      <netalias net="5V" schX={3} schY={-2} />
      <netalias net="5V" schX={4.5} schY={-2} />
      <trace path={[".5V", ".R2 > port.left"]} />
      <trace path={[".5V", ".R1 > port.left"]} />
      <trace path={[".R1 > port.right", ".LED1 > port.left"]} />
      <trace path={[".R2 > port.right", ".LED2 > port.left"]} />
      <trace path={[".LED1 > port.right", ".U1 > .TXLED"]} />
      <trace path={[".LED2 > port.right", ".U1 > .RXLED"]} />
      <netalias net="GND" schX={-3} schY={4} schRotation="180deg" />
      <netalias net="GND" schX={-5} schY={3} schRotation="180deg" />
      <netalias net="GND" schX={-6} schY={3} schRotation="180deg" />
      <netalias net="GND" schX={-7} schY={3} schRotation="180deg" />
      <netalias net="GND" schX={-8} schY={2} schRotation="180deg" />
      {/* <component>
      <schematicbox
        name="USB"
        center={[-9, 0]}
        type="schematic_box"
        drawing_type="box"
        width={2}
        height={2}
      />
    </component> */}
    </group>,
  )

  const circuitJson = circuit.getCircuitJson()

  return <Schematic soup={circuitJson} />
}

export default {
  title: "BugHighPortNumbers",
  component: BugHighPortNumbers,
}
