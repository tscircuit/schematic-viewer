import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import { JSDOM } from "jsdom"
import { act } from "react"
import { createRoot } from "react-dom/client"
import ddrSimulation from "../examples/ddr-simulation.circuit.json"
import SavedSimulation from "../examples/example15-simulation-viewer.fixture"

class TestResizeObserver {
  observe() {}
  disconnect() {}
}

test("the native DDR result renders its published eye and full waveform without network access", async () => {
  const circuitJson = ddrSimulation as CircuitJson
  const graphs = circuitJson.filter(
    (element) => element.type === "simulation_transient_voltage_graph",
  )
  expect(graphs).toHaveLength(1)
  for (const graph of graphs) {
    expect(graph.timestamps_ms).toHaveLength(163305)
    expect(graph.voltage_levels).toHaveLength(163305)
    expect(graph.timestamps_ms?.[0]).toBe(0)
    expect(graph.timestamps_ms?.at(-1)).toBeCloseTo(0.00016, 12)
  }

  const dom = new JSDOM('<div id="root"></div>', {
    pretendToBeVisual: true,
    url: "http://localhost",
  })
  const { window } = dom
  const { document } = window
  const svgBlobs: Blob[] = []
  let networkRequests = 0
  const globals = {
    window,
    document,
    Element: window.Element,
    HTMLElement: window.HTMLElement,
    ResizeObserver: TestResizeObserver,
    requestAnimationFrame: window.requestAnimationFrame,
    cancelAnimationFrame: window.cancelAnimationFrame,
    IS_REACT_ACT_ENVIRONMENT: true,
    fetch: async () => {
      networkRequests += 1
      throw new Error("The saved simulation must render offline")
    },
  }
  const previousGlobals = Object.fromEntries(
    Object.keys(globals).map((key) => [key, Reflect.get(globalThis, key)]),
  )
  const createObjectUrl = URL.createObjectURL
  const revokeObjectUrl = URL.revokeObjectURL
  Object.assign(globalThis, globals)
  URL.createObjectURL = (blob) => {
    if (!(blob instanceof Blob))
      throw new Error("Expected a simulation SVG blob")
    svgBlobs.push(blob)
    return `blob:simulation-${svgBlobs.length}`
  }
  URL.revokeObjectURL = () => {}
  let viewportWidth = 960
  let viewportHeight = 540
  window.Element.prototype.getBoundingClientRect = () =>
    new window.DOMRect(0, 0, viewportWidth, viewportHeight)
  const root = createRoot(document.getElementById("root")!)

  try {
    await act(async () => root.render(<SavedSimulation />))
    const simulationImage = document.querySelector<HTMLImageElement>(
      'img[alt="Circuit Simulation"]',
    )
    if (!simulationImage?.parentElement) {
      throw new Error("Expected the simulation image and its viewport")
    }
    const svg = await svgBlobs.at(-1)!.text()
    expect(svg).toMatch(/^<svg\b[^>]*width="960"/)
    expect(svg).toMatch(/^<svg\b[^>]*height="540"/)
    expect(svg).toContain("Folded time (ns)")
    expect(svg).toContain('data-eye-window-count="46"')
    expect(svg).toContain("DQ0_receive_eye_SWITCHING — Eye diagram")
    expect(svg).toContain(">1.25<")
    expect(svg).toContain(">2.5<")
    expect(svg).toContain(">3.75<")
    expect(svg).toContain(">5<")
    expect(svg).not.toContain("NaN")
    expect(svg).not.toContain("Infinity")

    const transformBeforeZoom = simulationImage.style.transform
    await act(async () => {
      simulationImage.parentElement!.dispatchEvent(
        new window.WheelEvent("wheel", {
          deltaY: -100,
          clientX: 480,
          clientY: 270,
          bubbles: true,
          cancelable: true,
        }),
      )
    })
    expect(simulationImage.style.transform).not.toBe(transformBeforeZoom)

    viewportWidth = 640
    viewportHeight = 400
    await act(async () => window.dispatchEvent(new window.Event("resize")))
    const resizedSvg = await svgBlobs.at(-1)!.text()
    expect(resizedSvg).toMatch(/^<svg\b[^>]*width="640"/)
    expect(resizedSvg).toMatch(/^<svg\b[^>]*height="400"/)

    const selector = document.querySelector("select")
    if (!selector) throw new Error("Expected the simulation result selector")
    expect(selector.options).toHaveLength(2)
    await act(async () => {
      selector.value = ""
      selector.dispatchEvent(new window.Event("change", { bubbles: true }))
    })
    const waveformSvg = await svgBlobs.at(-1)!.text()
    expect(waveformSvg).toContain("Time (ns)")
    expect(waveformSvg).toContain("DQ0_RX")
    expect(waveformSvg).not.toContain("NaN")
    expect(waveformSvg).not.toContain("Infinity")
    await act(async () => {
      selector.value = "simulation_eye_diagram_2"
      selector.dispatchEvent(new window.Event("change", { bubbles: true }))
    })
    expect(await svgBlobs.at(-1)!.text()).toContain(
      'data-eye-window-count="46"',
    )
    expect(networkRequests).toBe(0)
  } finally {
    await act(async () => root.unmount())
    URL.createObjectURL = createObjectUrl
    URL.revokeObjectURL = revokeObjectUrl
    Object.assign(globalThis, previousGlobals)
    window.close()
  }
})
