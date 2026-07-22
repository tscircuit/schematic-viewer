import { AnalogSimulationViewer } from "lib/components/AnalogSimulationViewer"
import {
  acSweepElements,
  withAnalogAnalysis,
} from "./analog-analysis-circuit-json"

const circuitJson = withAnalogAnalysis(acSweepElements)

export default () => (
  <AnalogSimulationViewer
    circuitJson={circuitJson}
    acSweepView="magnitude"
    containerStyle={{ width: "100vw", height: "100vh" }}
  />
)
