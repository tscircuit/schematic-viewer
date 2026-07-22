import { AnalogSimulationViewer } from "lib/components/AnalogSimulationViewer"
import {
  acSweepElements,
  withAnalogAnalysis,
} from "./analog-analysis-circuit-json"

const circuitJson = withAnalogAnalysis(acSweepElements)

export default () => (
  <AnalogSimulationViewer
    circuitJson={circuitJson}
    acSweepView="phase"
    containerStyle={{ width: "100vw", height: "100vh" }}
  />
)
