import React from "react"
import { AnalogSimulationViewer } from "../lib/components/AnalogSimulationViewer"
import * as Core from "@tscircuit/core"
import createNgspiceSpiceEngine from "@tscircuit/ngspice-spice-engine"

// TSX circuit definition
const AmmeterCircuitElement = (
  <board width="10mm" height="10mm" schMaxTraceDistance={10} routingDisabled>
    <voltagesource name="V1" voltage="15V" schX={-3} />
    <ammeter
      name="AM1"
      color="#ff0000"
      connections={{
        pos: ".V1 > .pin1",
        neg: ".R1 > .pin1",
      }}
    />
    <resistor name="R1" resistance="2" schX={3} />
    <trace from=".R1 > .pin2" to=".V1 > .pin2" />
    <voltageprobe
      name="VOUT"
      color="#315cff"
      connectsTo=".R1 > .pin1"
      referenceTo=".V1 > .pin2"
    />
    <analogsimulation
      duration="1ms"
      timePerStep="100us"
      spiceEngine="ngspice"
    />
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
    circuit.add(AmmeterCircuitElement)
    await circuit.renderUntilSettled()

    // Step 3: Get CircuitJSON (includes simulation data if produced by the platform)
    return circuit.getCircuitJson()
  } catch (error) {
    console.error("Simulation failed:", error)
    // Return basic CircuitJSON if simulation fails
    const fallbackCircuit = new Core.Circuit()
    fallbackCircuit.add(AmmeterCircuitElement)
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
        <h2>Ammeter & Current Probe Example</h2>
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
        <h2>Ammeter & Current Probe Example</h2>
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
          width: "100vw",
          height: "100vh",
        }}
      />
    )
  )
}
