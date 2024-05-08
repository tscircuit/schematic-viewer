import { Schematic } from "../../Schematic"

export const Bug6TraceScaling = () => {
  return (
    <Schematic style={{ height: 500 }}>
      <resistor name="R1" resistance="10 ohm" schX={2} schY={1} />
      {/* <powersource voltage="5V" schX={1} schY={2} name="main_power" /> */}
      <resistor resistance="1k" schX={1} schY={2} name="main_power" />
      {/* <trace path={[".main_power > port.negative", ".R1 > port.left"]} /> */}
      <trace path={[".main_power > port.right", ".R1 > port.left"]} />
    </Schematic>
    // <Schematic
    //   style={{ height: 500 }}
    //   soup={[
    //     {
    //       type: "source_trace",
    //       source_trace_id: "source_trace_0",
    //     },
    //     {
    //       type: "schematic_trace",
    //       source_trace_id: "source_trace_0",
    //       schematic_trace_id: "schematic_trace_0",
    //       edges: [
    //         {
    //           from: {
    //             x: 1,
    //             y: 1.4000000000000001,
    //           },
    //           to: {
    //             x: 1,
    //             y: 1,
    //           },
    //         },
    //         {
    //           from: {
    //             x: 1,
    //             y: 1,
    //           },
    //           to: {
    //             x: 1.4000000000000001,
    //             y: 1,
    //           },
    //         },
    //       ],
    //     },
    //   ]}
    // />
  )
}

export default {
  title: "Bugs/Bug6TraceScaling",
  component: Bug6TraceScaling,
}
