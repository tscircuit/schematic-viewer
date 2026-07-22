import { AnalogSimulationViewer } from "lib/components/AnalogSimulationViewer"
import {
  dcSweepElements,
  withAnalogAnalysis,
} from "./analog-analysis-circuit-json"

const circuitJson = withAnalogAnalysis(dcSweepElements)

export default () => (
  <AnalogSimulationViewer
    circuitJson={circuitJson}
    containerStyle={{ width: "100vw", height: "100vh" }}
  />
)
