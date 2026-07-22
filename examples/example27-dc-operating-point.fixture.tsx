import { AnalogSimulationViewer } from "lib/components/AnalogSimulationViewer"
import {
  dcOperatingPointElements,
  withAnalogAnalysis,
} from "./analog-analysis-circuit-json"

const circuitJson = withAnalogAnalysis(dcOperatingPointElements)

export default () => (
  <AnalogSimulationViewer
    circuitJson={circuitJson}
    containerStyle={{ width: "100vw", height: "100vh" }}
  />
)
