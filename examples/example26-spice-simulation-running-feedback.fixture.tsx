import { SpicePlot } from "../lib/components/SpicePlot"

export default () => (
  <div style={{ padding: "24px", fontFamily: "sans-serif" }}>
    <h2 style={{ marginTop: 0 }}>SPICE Simulation Feedback: Running</h2>
    <SpicePlot plotData={[]} nodes={[]} isLoading hasRun error={null} />
  </div>
)
