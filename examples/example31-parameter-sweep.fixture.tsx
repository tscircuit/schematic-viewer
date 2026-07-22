import { AnalogSimulationViewer } from "lib/components/AnalogSimulationViewer"
import {
  parameterSweepElements,
  withAnalogAnalysis,
} from "./analog-analysis-circuit-json"

const circuitJson = withAnalogAnalysis(parameterSweepElements)

export default () => (
  <AnalogSimulationViewer
    circuitJson={circuitJson}
    containerStyle={{ width: "100vw", height: "100vh" }}
  />
)
