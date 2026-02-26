import { SpicePlot } from "../lib/components/SpicePlot"

export default () => (
  <div style={{ padding: "24px", fontFamily: "sans-serif" }}>
    <h2 style={{ marginTop: 0 }}>
      SPICE Simulation Feedback: No Visible Traces
    </h2>
    <SpicePlot
      plotData={[{ name: "0.00e+0", "V(OUT)": 4.9 }]}
      nodes={[]}
      isLoading={false}
      hasRun
      error={null}
    />
  </div>
)
