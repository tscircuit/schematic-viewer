import type * as EecircuitEngine from "../types/eecircuit-engine"

let sim: EecircuitEngine.Simulation | null = null

const fetchSimulation = async (): Promise<
  typeof EecircuitEngine.Simulation
> => {
  const module = await import(
    // @ts-ignore
    "https://cdn.jsdelivr.net/npm/eecircuit-engine@1.5.2/+esm"
  )
  return module.Simulation as typeof EecircuitEngine.Simulation
}

const initializeSimulation = async () => {
  if (sim && sim.isInitialized()) return
  const Simulation = await fetchSimulation()
  sim = new Simulation()
  await sim.start()
}

self.onmessage = async (event: MessageEvent<{ spiceString: string }>) => {
  try {
    await initializeSimulation()
    if (!sim) throw new Error("Simulation not initialized")

    let engineSpiceString = event.data.spiceString
    const wrdataMatch = engineSpiceString.match(/wrdata\s+(\S+)\s+(.*)/i)
    if (wrdataMatch) {
      const variables = wrdataMatch[2].trim().split(/\s+/)
      const probeLine = `.probe ${variables.join(" ")}`
      engineSpiceString = engineSpiceString.replace(/wrdata.*/i, probeLine)
    } else if (!engineSpiceString.match(/\.probe/i)) {
      const plotMatch = engineSpiceString.match(/plot\s+(.*)/i)
      if (plotMatch) {
        throw new Error(
          "The 'plot' command is not supported for data extraction. Please use 'wrdata <filename> <var1> ...' or '.probe <var1> ...' instead.",
        )
      }
      throw new Error(
        "No '.probe' or 'wrdata' command found in SPICE file. Use 'wrdata <filename> <var1> ...' to specify output.",
      )
    }

    sim.setNetList(engineSpiceString)
    const result = await sim.runSim()
    self.postMessage({ type: "result", result })
  } catch (e: any) {
    self.postMessage({ type: "error", error: e.message })
  }
}
