import type { CircuitJson } from "circuit-json"
import { AnalogSimulationViewer } from "lib/components/AnalogSimulationViewer"
import { renderToCircuitJson } from "lib/dev/render-to-circuit-json"

const schematicCircuitJson = renderToCircuitJson(
  <board routingDisabled>
    <voltagesource name="V1" voltage="5V" />
    <resistor name="R1" resistance="1k" />
    <resistor name="R2" resistance="2k" />
    <trace from=".V1 > .pin1" to=".R1 > .pin1" />
    <trace from=".R1 > .pin2" to=".R2 > .pin1" />
    <trace from=".R2 > .pin2" to=".V1 > .pin2" />
  </board>,
)

const simulationElements = [
  { name: "Root Fast", color: "#315cff", peak: 5 },
  { name: "Root Slow", color: "#8a35d7", peak: 3.5 },
  { name: "Input Group", color: "#e05252", peak: 2.5 },
  { name: "Output Group", color: "#15803d", peak: 1.5 },
].flatMap(({ name, color, peak }, index) => {
  const simulationExperimentId = `simulation_experiment_${index}`
  return [
    {
      type: "simulation_experiment",
      simulation_experiment_id: simulationExperimentId,
      name,
      experiment_type: "spice_transient_analysis",
      time_per_step: 0.25,
      start_time_ms: 0,
      end_time_ms: 1,
    },
    {
      type: "simulation_transient_voltage_graph",
      simulation_transient_voltage_graph_id: `simulation_transient_voltage_graph_${index}`,
      simulation_experiment_id: simulationExperimentId,
      voltage_levels: [0, peak * 0.5, peak, peak * 0.75, 0],
      time_per_step: 0.25,
      start_time_ms: 0,
      end_time_ms: 1,
      name,
      color,
    },
  ]
})

const circuitJson = [
  ...schematicCircuitJson,
  ...simulationElements,
] as CircuitJson

export default () => (
  <AnalogSimulationViewer
    circuitJson={circuitJson}
    containerStyle={{ width: "100vw", height: "100vh" }}
  />
)
