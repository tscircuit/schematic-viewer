import type { CircuitJson } from "circuit-json"

const [sourcePath, experimentName, probeName, outputPath] = Bun.argv.slice(2)
if (!sourcePath || !experimentName || !probeName || !outputPath) {
  throw new Error(
    "Usage: bun scripts/create-simulation-fixture.ts <circuit-results.json> <experiment-name> <probe-name> <output.circuit.json>",
  )
}
const circuitJson: CircuitJson = await Bun.file(sourcePath).json()
const experiments = circuitJson
  .filter((element) => element.type === "simulation_experiment")
  .filter((experiment) => experiment.name === experimentName)
const probes = circuitJson
  .filter((element) => element.type === "simulation_voltage_probe")
  .filter((probe) => probe.name === probeName)
const experiment = experiments[0]
const probe = probes[0]
if (experiments.length !== 1 || probes.length !== 1 || !experiment || !probe) {
  throw new Error(
    "The fixture requires one experiment and one voltage probe with the requested names",
  )
}
const eyes = circuitJson
  .filter((element) => element.type === "simulation_eye_diagram")
  .filter(
    (eye) =>
      eye.simulation_experiment_id === experiment.simulation_experiment_id &&
      eye.simulation_voltage_probe_id === probe.simulation_voltage_probe_id,
  )
const graphs = circuitJson
  .filter((element) => element.type === "simulation_transient_voltage_graph")
  .filter(
    (graph) =>
      graph.simulation_experiment_id === experiment.simulation_experiment_id &&
      graph.simulation_voltage_probe_id === probe.simulation_voltage_probe_id,
  )
if (eyes.length !== 1 || graphs.length !== 1) {
  throw new Error(
    "The fixture requires one declared eye and one recorded voltage graph for the requested experiment and probe",
  )
}
// Select original records in their original order; keep every solver timestamp and voltage.
const selectedRecords = circuitJson.filter(
  (element) =>
    element === experiment ||
    element === probe ||
    element === eyes[0] ||
    element === graphs[0],
)
await Bun.write(outputPath, `${JSON.stringify(selectedRecords, null, 2)}\n`)
