import { describe, expect, test } from "bun:test"
import {
  colorMap,
  convertCircuitJsonToSimulationGraphSvg,
  type CircuitJsonWithSimulation,
} from "circuit-to-svg"
import { getAnalogSimulationBackgroundColor } from "./get-analog-simulation-background-color"

const simulationExperimentId = "simulation_experiment_background_test"

const circuitJson = [
  {
    type: "simulation_experiment",
    simulation_experiment_id: simulationExperimentId,
    name: "Background Test",
    experiment_type: "spice_transient_analysis",
    time_per_step: 0.1,
    start_time_ms: 0,
    end_time_ms: 0.2,
  },
  {
    type: "simulation_transient_voltage_graph",
    simulation_transient_voltage_graph_id: "voltage_graph_background_test",
    simulation_experiment_id: simulationExperimentId,
    voltage_levels: [0, 1, 2],
    time_per_step: 0.1,
    start_time_ms: 0,
    end_time_ms: 0.2,
  },
] as CircuitJsonWithSimulation[]

const graphSvg = convertCircuitJsonToSimulationGraphSvg({
  circuitJson,
  simulation_experiment_id: simulationExperimentId,
})

const graphSvgWithoutRootBackground = graphSvg.replace(
  /\sstyle="[^"]*background-color:[^"]*"/i,
  "",
)

describe("getAnalogSimulationBackgroundColor", () => {
  test("reads the background rectangle color from graph-only SVGs without a root background style", () => {
    const backgroundColor = getAnalogSimulationBackgroundColor(
      graphSvgWithoutRootBackground,
    )

    expect(backgroundColor).toBe(colorMap.schematic.background)
    expect(backgroundColor).not.toBe("transparent")
  })

  test("matches a custom graph background", () => {
    const customBackground = "#123456"
    const graphSvgWithCustomBackground =
      graphSvgWithoutRootBackground.replaceAll(
        colorMap.schematic.background,
        customBackground,
      )

    expect(
      getAnalogSimulationBackgroundColor(graphSvgWithCustomBackground, {
        schematic: { background: customBackground },
      }),
    ).toBe(customBackground)
  })

  test("falls back to the effective schematic background", () => {
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

  test("keeps the root SVG background authoritative for combined rendering", () => {
    expect(
      getAnalogSimulationBackgroundColor(
        '<svg style="background-color: #fedcba"><style>.background { fill: #ffffff; }</style></svg>',
      ),
    ).toBe("#fedcba")
  })
})
