import { SpicePlot } from "../lib/components/SpicePlot"

export default () => (
  <div style={{ padding: "24px", fontFamily: "sans-serif" }}>
    <h2 style={{ marginTop: 0 }}>SPICE Error: Unsupported Result Type</h2>
    <SpicePlot
      plotData={[]}
      nodes={[]}
      isLoading={false}
      hasRun
      error="Unsupported data type in simulation result"
    />
  </div>
)
