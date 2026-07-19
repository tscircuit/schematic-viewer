import type { CircuitJson } from "circuit-json"
import { AnalogSimulationViewer } from "lib/components/AnalogSimulationViewer"
import { renderToCircuitJson } from "lib/dev/render-to-circuit-json"

const simulationExperimentId = "simulation_experiment_graph_only"
const simulationVoltageGraphId = "simulation_transient_voltage_graph_output"

const schematicCircuitJson = renderToCircuitJson(
  <board routingDisabled>
    <voltagesource name="V1" voltage="5V" />
    <resistor name="R1" resistance="1k" />
    <capacitor name="C1" capacitance="1uF" />
    <trace from=".V1 > .pin1" to=".R1 > .pin1" />
    <trace from=".R1 > .pin2" to=".C1 > .pin1" />
    <trace from=".C1 > .pin2" to=".V1 > .pin2" />
  </board>,
)

const circuitJson = [
  ...schematicCircuitJson,
  {
    type: "simulation_experiment",
    simulation_experiment_id: simulationExperimentId,
    name: "RC Transient Response",
    experiment_type: "spice_transient_analysis",
    time_per_step: 0.1,
    start_time_ms: 0,
    end_time_ms: 1,
  },
  {
    type: "simulation_transient_voltage_graph",
    simulation_transient_voltage_graph_id: simulationVoltageGraphId,
    simulation_experiment_id: simulationExperimentId,
    voltage_levels: [
      0, 0.48, 0.91, 1.3, 1.65, 1.97, 2.26, 2.52, 2.76, 2.97, 3.16,
    ],
    time_per_step: 0.1,
    start_time_ms: 0,
    end_time_ms: 1,
    name: "V(out)",
    color: "#315cff",
  },
] as CircuitJson

export default () => (
  <AnalogSimulationViewer
    circuitJson={circuitJson}
    hideSchematic
    containerStyle={{ width: "100vw", height: "100vh" }}
  />
)
