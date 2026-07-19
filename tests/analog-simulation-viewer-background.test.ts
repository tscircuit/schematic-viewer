import { expect, test } from "bun:test"
import {
  type CircuitJsonWithSimulation,
  colorMap,
  convertCircuitJsonToSimulationGraphSvg,
} from "circuit-to-svg"
import { getAnalogSimulationBackgroundColor } from "../lib/utils/get-analog-simulation-background-color"

const simulationExperimentId = "simulation-experiment-background-test"

const circuitJson: CircuitJsonWithSimulation[] = [
  {
    type: "simulation_experiment",
    simulation_experiment_id: simulationExperimentId,
    name: "Background Test",
    experiment_type: "spice_transient_analysis",
    start_time_ms: 0,
    end_time_ms: 0.2,
    time_per_step: 0.1,
  },
  {
    type: "simulation_transient_voltage_graph",
    simulation_transient_voltage_graph_id: "voltage-graph-background-test",
    simulation_experiment_id: simulationExperimentId,
    voltage_levels: [0, 1, 2],
    start_time_ms: 0,
    end_time_ms: 0.2,
    time_per_step: 0.1,
  },
]

const graphSvg = convertCircuitJsonToSimulationGraphSvg({
  circuitJson,
  simulation_experiment_id: simulationExperimentId,
})

// circuit-to-svg@0.0.390 painted the graph background without exposing the
// matching color on the root SVG element.
const graphSvgWithoutRootBackground = graphSvg.replace(
  /\sstyle="[^"]*background-color:[^"]*"/i,
  "",
)

test("graph-only canvas matches the background rectangle", () => {
  const backgroundColor = getAnalogSimulationBackgroundColor(
    graphSvgWithoutRootBackground,
  )

  expect(backgroundColor).toBe(colorMap.schematic.background)
  expect(backgroundColor).not.toBe("transparent")
})

test("graph-only canvas matches a custom graph background", () => {
  const customBackground = "#123456"
  const graphSvgWithCustomBackground = graphSvgWithoutRootBackground.replaceAll(
    colorMap.schematic.background,
    customBackground,
  )

  expect(
    getAnalogSimulationBackgroundColor(graphSvgWithCustomBackground, {
      schematic: { background: "#ffffff" },
    }),
  ).toBe(customBackground)
})

test("canvas falls back to the effective schematic background", () => {
  const customBackground = "#abcdef"

  expect(
    getAnalogSimulationBackgroundColor("<svg></svg>", {
      schematic: { background: customBackground },
    }),
  ).toBe(customBackground)
  expect(getAnalogSimulationBackgroundColor("<svg></svg>")).toBe(
    colorMap.schematic.background,
  )
})

test("combined rendering keeps the root SVG background", () => {
  const combinedSvg = `
    <svg style="background-color: #fedcba">
      <style>.background { fill: #ffffff; }</style>
    </svg>
  `

  expect(getAnalogSimulationBackgroundColor(combinedSvg)).toBe("#fedcba")
})
