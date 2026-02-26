import { SpicePlot } from "../lib/components/SpicePlot"

export default () => (
  <div style={{ padding: "24px", fontFamily: "sans-serif" }}>
    <h2 style={{ marginTop: 0 }}>SPICE Simulation Feedback: Success</h2>
    <SpicePlot
      plotData={[
        { name: "0", "V(OUT)": 0, "I(V1)": 0.0012 },
        { name: "5e-6", "V(OUT)": 1.2, "I(V1)": 0.0011 },
        { name: "10e-6", "V(OUT)": 2.3, "I(V1)": 0.001 },
        { name: "15e-6", "V(OUT)": 3.1, "I(V1)": 0.0009 },
        { name: "20e-6", "V(OUT)": 3.7, "I(V1)": 0.00085 },
      ]}
      nodes={["V(OUT)", "I(V1)"]}
      isLoading={false}
      hasRun
      error={null}
    />
  </div>
)
