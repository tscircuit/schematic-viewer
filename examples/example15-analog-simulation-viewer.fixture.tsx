import React from "react"
import { AnalogSimulationViewer } from "../lib/components/AnalogSimulationViewer"
import * as Core from "@tscircuit/core"
import { getSpiceFromCircuitJson } from "../lib/utils/spice-utils"
import createNgspiceSpiceEngine from "@tscircuit/ngspice-spice-engine"

// TSX circuit definition
const SwitchCircuitElement = (
  <board schMaxTraceDistance={10} routingDisabled>
    <voltagesource name="V1" voltage="5V" />
    <resistor name="R_base" resistance="10k" schY={2} />
    <switch name="SW1" simSwitchFrequency="1kHz" schX={1.5} schY={2} />
    <transistor
      name="Q1"
      type="npn"
      footprint="sot23"
      schX={2}
      schY={0.3}
      schRotation={180}
    />
    <resistor name="R_collector" resistance="10k" schY={-2} />

    <trace from=".V1 > .pin1" to=".R_base > .pin1" />
    <trace from=".R_base > .pin2" to=".SW1 > .pin1" />
    <trace from=".SW1 > .pin2" to=".Q1 > .base" />

    <trace from=".V1 > .pin1" to=".R_collector > .pin1" />
    <trace from=".R_collector > .pin2" to=".Q1 > .collector" />

    <trace from=".Q1 > .emitter" to=".V1 > .pin2" />

    <voltageprobe name="VP_COLLECTOR" connectsTo=".R_collector > .pin2" />

    <analogsimulation duration="4ms" timePerStep="1us" spiceEngine="ngspice" />
  </board>
)

// Convert TSX to CircuitJSON and add simulation data
const createSimulatedCircuitJson = async () => {
  try {
    // Step 1: Create circuit with platform configuration
    const circuit = new Core.Circuit()
    circuit.setPlatform({
      spiceEngineMap: {
        ngspice: await createNgspiceSpiceEngine(),
      },
    })

    // Step 2: Add the circuit element
    circuit.add(SwitchCircuitElement)
    await circuit.renderUntilSettled()

    // Step 3: Get CircuitJSON
    const circuitJson = circuit.getCircuitJson()

    // Step 4: Initialize SPICE engine for manual simulation
    const spiceEngine = await createNgspiceSpiceEngine()

    // Step 5: Generate SPICE string and run simulation
    const spiceString = getSpiceFromCircuitJson(circuitJson)

    if (!spiceString) {
      console.warn("No SPICE string generated from CircuitJSON")
      return circuitJson
    }

    console.log("Running SPICE simulation...")
    console.log("SPICE string:", spiceString)

    // Step 6: Run simulation
    const { simulationResultCircuitJson } =
      await spiceEngine.simulate(spiceString)

    if (simulationResultCircuitJson && simulationResultCircuitJson.length > 0) {
      console.log("Simulation completed successfully!")
      console.log(
        "Generated",
        simulationResultCircuitJson.length,
        "simulation results",
      )

      // Add simulation experiment ID to the simulation results
      const simulationExperimentId = `simulation_exp_${Date.now()}`
      const enhancedSimulationResults = simulationResultCircuitJson.map(
        (item: any) => ({
          ...item,
          simulation_experiment_id: simulationExperimentId,
        }),
      )

      // Add simulation experiment definition
      const simulationExperiment = {
        type: "simulation_experiment",
        simulation_experiment_id: simulationExperimentId,
        name: "spice_transient_analysis",
        experiment_type: "spice_transient_analysis",
        end_time_ms: 4,
        time_per_step: 0.001,
        spice_engine: "ngspice",
      }

      // Merge simulation results with original CircuitJSON
      return [
        ...circuitJson,
        simulationExperiment,
        ...enhancedSimulationResults,
      ]
    } else {
      console.warn("No simulation results generated")
      return circuitJson
    }
  } catch (error) {
    console.error("Simulation failed:", error)
    // Return basic CircuitJSON if simulation fails
    const fallbackCircuit = new Core.Circuit()
    fallbackCircuit.add(SwitchCircuitElement)
    await fallbackCircuit.renderUntilSettled()
    return fallbackCircuit.getCircuitJson()
  }
}

export default () => {
  const [simulatedCircuitJson, setSimulatedCircuitJson] = React.useState<
    any[] | null
  >(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const loadAndSimulateCircuit = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const result = await createSimulatedCircuitJson()
        setSimulatedCircuitJson(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load circuit")
        console.error("Error loading circuit:", err)
      } finally {
        setIsLoading(false)
      }
    }

    loadAndSimulateCircuit()
  }, [])

  if (isLoading) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <h2>Analog Simulation Viewer Example</h2>
        <p>Converting TSX to CircuitJSON and running SPICE simulation...</p>
        <div
          style={{
            display: "inline-block",
            padding: "20px",
            backgroundColor: "#f5f5f5",
            borderRadius: "8px",
            marginTop: "20px",
          }}
        >
          Loading and simulating circuit...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <h2>Analog Simulation Viewer Example</h2>
        <div
          style={{
            display: "inline-block",
            padding: "20px",
            backgroundColor: "#fef2f2",
            borderRadius: "8px",
            border: "1px solid #fecaca",
            color: "#dc2626",
            marginTop: "20px",
          }}
        >
          <h4>Error:</h4>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {" "}
      {simulatedCircuitJson && (
        <AnalogSimulationViewer
          circuitJson={simulatedCircuitJson as any}
          containerStyle={{
            border: "1px solid #ccc",
            borderRadius: "8px",
          }}
        />
      )}
    </>
  )
}
