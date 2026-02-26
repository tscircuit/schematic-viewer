import { SpicePlot } from "../lib/components/SpicePlot"

export default () => (
  <div style={{ padding: "24px", fontFamily: "sans-serif" }}>
    <h2 style={{ marginTop: 0 }}>SPICE Error: Engine Not Initialized</h2>
    <SpicePlot
      plotData={[]}
      nodes={[]}
      isLoading={false}
      hasRun
      error="Simulation not initialized"
    />
  </div>
)
