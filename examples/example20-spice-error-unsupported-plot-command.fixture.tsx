import { SpicePlot } from "../lib/components/SpicePlot"

export default () => (
  <div style={{ padding: "24px", fontFamily: "sans-serif" }}>
    <h2 style={{ marginTop: 0 }}>SPICE Error: Unsupported plot Command</h2>
    <SpicePlot
      plotData={[]}
      nodes={[]}
      isLoading={false}
      hasRun
      error="The 'plot' command is not supported for data extraction. Please use 'wrdata <filename> <var1> ...' or '.probe <var1> ...' instead."
    />
  </div>
)
