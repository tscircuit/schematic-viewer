import { SpicePlot } from "../lib/components/SpicePlot"

export default () => (
  <div style={{ padding: "24px", fontFamily: "sans-serif" }}>
    <h2 style={{ marginTop: 0 }}>SPICE Error: Missing .probe / wrdata</h2>
    <SpicePlot
      plotData={[]}
      nodes={[]}
      isLoading={false}
      hasRun
      error="No '.probe' or 'wrdata' command found in SPICE file. Use 'wrdata <filename> <var1> ...' to specify output."
    />
  </div>
)
