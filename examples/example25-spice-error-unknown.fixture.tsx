import { SpicePlot } from "../lib/components/SpicePlot"

export default () => (
  <div style={{ padding: "24px", fontFamily: "sans-serif" }}>
    <h2 style={{ marginTop: 0 }}>SPICE Error: Unknown</h2>
    <SpicePlot
      plotData={[]}
      nodes={[]}
      isLoading={false}
      hasRun
      error="Singular matrix: netlist could not be solved at iteration 0"
    />
  </div>
)
