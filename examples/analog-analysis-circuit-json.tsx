import type { CircuitJson } from "circuit-json"
import { renderToCircuitJson } from "lib/dev/render-to-circuit-json"

const schematicCircuitJson = renderToCircuitJson(
  <board routingDisabled>
    <voltagesource name="VIN" voltage="5V" />
    <resistor name="R1" resistance="1k" />
    <capacitor name="C1" capacitance="1uF" />
    <trace from=".VIN > .pin1" to=".R1 > .pin1" />
    <trace from=".R1 > .pin2" to=".C1 > .pin1" />
    <trace from=".C1 > .pin2" to=".VIN > .pin2" />
  </board>,
)

export const withSchematicCircuitJson = (
  simulationCircuitJson: CircuitJson,
): CircuitJson => [...schematicCircuitJson, ...simulationCircuitJson]

export const dcOperatingPointCircuitJson = [
  {
    type: "simulation_experiment",
    simulation_experiment_id: "simulation_experiment_dc_operating_point",
    name: "DC Bias Point",
    experiment_type: "spice_dc_operating_point",
  },
  {
    type: "simulation_dc_operating_point_voltage",
    simulation_dc_operating_point_voltage_id:
      "simulation_dc_operating_point_voltage_vout",
    simulation_experiment_id: "simulation_experiment_dc_operating_point",
    simulation_voltage_probe_id: "simulation_voltage_probe_vout",
    name: "VOUT",
    voltage: 3.3,
    color: "#315cff",
  },
  {
    type: "simulation_dc_operating_point_current",
    simulation_dc_operating_point_current_id:
      "simulation_dc_operating_point_current_load",
    simulation_experiment_id: "simulation_experiment_dc_operating_point",
    simulation_current_probe_id: "simulation_current_probe_load",
    name: "I(R1)",
    current: 1.2,
    color: "#dc2626",
  },
] satisfies CircuitJson

export const dcSweepCircuitJson = [
  {
    type: "simulation_experiment",
    simulation_experiment_id: "simulation_experiment_dc_sweep",
    name: "Line Regulation",
    experiment_type: "spice_dc_sweep",
    dc_sweep_voltage_source_id: "source_component_vin",
    dc_sweep_start: 0,
    dc_sweep_stop: 5,
    dc_sweep_step: 1,
    dc_sweep_unit: "V",
  },
  {
    type: "simulation_dc_sweep_voltage_graph",
    simulation_dc_sweep_voltage_graph_id:
      "simulation_dc_sweep_voltage_graph_vout",
    simulation_experiment_id: "simulation_experiment_dc_sweep",
    simulation_voltage_probe_id: "simulation_voltage_probe_vout",
    name: "VOUT",
    sweep_values: [0, 1, 2, 3, 4, 5],
    sweep_unit: "V",
    voltage_levels: [0, 0.9, 1.8, 2.7, 3.3, 3.3],
    color: "#315cff",
  },
  {
    type: "simulation_dc_sweep_current_graph",
    simulation_dc_sweep_current_graph_id:
      "simulation_dc_sweep_current_graph_load",
    simulation_experiment_id: "simulation_experiment_dc_sweep",
    simulation_current_probe_id: "simulation_current_probe_load",
    name: "I(R1)",
    sweep_values: [0, 1, 2, 3, 4, 5],
    sweep_unit: "V",
    current_levels: [0, 0.45, 0.9, 1.35, 1.65, 1.65],
    color: "#dc2626",
  },
] satisfies CircuitJson

export const acSweepCircuitJson = [
  {
    type: "simulation_experiment",
    simulation_experiment_id: "simulation_experiment_ac_sweep",
    name: "Frequency Response",
    experiment_type: "spice_ac_analysis",
    ac_sweep_type: "decade",
    ac_samples_per_interval: 10,
    ac_start_frequency_hz: 10,
    ac_stop_frequency_hz: 1_000_000,
  },
  {
    type: "simulation_ac_sweep_voltage_graph",
    simulation_ac_sweep_voltage_graph_id:
      "simulation_ac_sweep_voltage_graph_vout",
    simulation_experiment_id: "simulation_experiment_ac_sweep",
    simulation_voltage_probe_id: "simulation_voltage_probe_vout",
    name: "VOUT",
    frequencies_hz: [10, 100, 1_000, 10_000, 100_000, 1_000_000],
    complex_voltages: [
      { re: 1, im: -0.01 },
      { re: 0.99, im: -0.05 },
      { re: 0.9, im: -0.2 },
      { re: 0.5, im: -0.5 },
      { re: 0.08, im: -0.25 },
      { re: 0.005, im: -0.05 },
    ],
    color: "#315cff",
  },
  {
    type: "simulation_ac_sweep_current_graph",
    simulation_ac_sweep_current_graph_id:
      "simulation_ac_sweep_current_graph_input",
    simulation_experiment_id: "simulation_experiment_ac_sweep",
    simulation_current_probe_id: "simulation_current_probe_input",
    name: "I(VIN)",
    frequencies_hz: [10, 100, 1_000, 10_000, 100_000, 1_000_000],
    complex_currents: [
      { re: -0.6, im: 0.01 },
      { re: -0.59, im: 0.04 },
      { re: -0.52, im: 0.12 },
      { re: -0.3, im: 0.3 },
      { re: -0.05, im: 0.15 },
      { re: -0.003, im: 0.03 },
    ],
    color: "#dc2626",
  },
] satisfies CircuitJson

export const parameterSweepCircuitJson = [
  {
    type: "simulation_experiment",
    simulation_experiment_id: "simulation_experiment_parameter_sweep",
    name: "Load Bias Sweep",
    experiment_type: "spice_dc_operating_point",
  },
  {
    type: "simulation_parameter_sweep",
    simulation_parameter_sweep_id: "simulation_parameter_sweep_load",
    simulation_experiment_id: "simulation_experiment_parameter_sweep",
    name: "Load Resistance",
    parameter_type: "resistance",
    resistor_source_component_id: "source_component_r1",
    parameter_values: [100, 1_000, 10_000],
    parameter_unit: "Ω",
  },
  ...[
    { resistance: 100, voltage: 0.45, current: 1.8 },
    { resistance: 1_000, voltage: 2.5, current: 1.2 },
    { resistance: 10_000, voltage: 4.55, current: 0.4 },
  ].flatMap((sweepResult, sweepIndex) => {
    const simulationParameterSweepCoordinate = {
      simulation_parameter_sweep_id: "simulation_parameter_sweep_load",
      sweep_index: sweepIndex,
      parameter_value: sweepResult.resistance,
      parameter_unit: "Ω" as const,
    }
    return [
      {
        type: "simulation_dc_operating_point_voltage",
        simulation_dc_operating_point_voltage_id: `simulation_dc_operating_point_voltage_${sweepIndex}`,
        simulation_experiment_id: "simulation_experiment_parameter_sweep",
        simulation_parameter_sweep_coordinate:
          simulationParameterSweepCoordinate,
        simulation_voltage_probe_id: "simulation_voltage_probe_vout",
        name: "VOUT",
        voltage: sweepResult.voltage,
        color: "#315cff",
      },
      {
        type: "simulation_dc_operating_point_current",
        simulation_dc_operating_point_current_id: `simulation_dc_operating_point_current_${sweepIndex}`,
        simulation_experiment_id: "simulation_experiment_parameter_sweep",
        simulation_parameter_sweep_coordinate:
          simulationParameterSweepCoordinate,
        simulation_current_probe_id: "simulation_current_probe_load",
        name: "I(R1)",
        current: sweepResult.current,
        color: "#dc2626",
      },
    ] satisfies CircuitJson
  }),
] satisfies CircuitJson
