import React from "react"
import { AnalogSimulationViewer } from "../lib/components/AnalogSimulationViewer"
import * as Core from "@tscircuit/core"
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

    const ngspiceEngine = await createNgspiceSpiceEngine()
    circuit.setPlatform({
      spiceEngineMap: {
        ngspice: ngspiceEngine,
      },
    })

    // Step 2: Add the circuit element
    circuit.add(SwitchCircuitElement)
    await circuit.renderUntilSettled()

    // Step 3: Get CircuitJSON (includes simulation data if produced by the platform)
    return circuit.getCircuitJson()
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
    simulatedCircuitJson && (
      <AnalogSimulationViewer
        circuitJson={simulatedCircuitJson}
        containerStyle={{
          border: "1px solid #ccc",
          borderRadius: "8px",
        }}
      />
    )
  )
}
