import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import { JSDOM } from "jsdom"
import { act } from "react"
import { createRoot } from "react-dom/client"
import wifiSmartSwitch from "../examples/wifi-smart-switch.circuit.json"
import { SchematicViewer } from "../lib/components/SchematicViewer"

class TestResizeObserver {
  observe() {}
  disconnect() {}
}

const circuitJson = wifiSmartSwitch as CircuitJson
const componentId = "schematic_component_0"
const textId = "schematic_text_16"

test("outlines only the highlighted elements that are rendered", async () => {
  const dom = new JSDOM('<div id="root"></div>', {
    pretendToBeVisual: true,
    url: "http://localhost",
  })
  const { window } = dom
  const { document } = window
  const globals = {
    window,
    document,
    Element: window.Element,
    HTMLElement: window.HTMLElement,
    MutationObserver: window.MutationObserver,
    ResizeObserver: TestResizeObserver,
    requestAnimationFrame: window.requestAnimationFrame,
    cancelAnimationFrame: window.cancelAnimationFrame,
    IS_REACT_ACT_ENVIRONMENT: true,
  }
  const previousGlobals = Object.fromEntries(
    Object.keys(globals).map((key) => [key, Reflect.get(globalThis, key)]),
  )
  Object.assign(globalThis, globals)
  window.Element.prototype.getBoundingClientRect = () =>
    new window.DOMRect(0, 0, 1024, 768)

  const root = createRoot(document.getElementById("root")!)
  const render = async (highlights: {
    componentIds?: string[]
    textIds?: string[]
  }) => {
    await act(async () => {
      root.render(
        <SchematicViewer
          circuitJson={circuitJson}
          netHoverHighlightEnabled={false}
          searchEnabled={false}
          highlightedSchematicComponentIds={highlights.componentIds}
          highlightedSchematicTextIds={highlights.textIds}
        />,
      )
    })
    // Outlines are measured on the animation frame after they mount.
    await act(
      () => new Promise<void>((resolve) => window.setTimeout(resolve, 50)),
    )
  }
  const countHighlights = () =>
    document.querySelectorAll("[data-schematic-element-highlight]").length

  try {
    await render({})
    expect(countHighlights()).toBe(0)

    await render({
      componentIds: [componentId, "schematic_component_missing"],
      textIds: [textId],
    })
    expect(countHighlights()).toBe(2)

    await render({ componentIds: [], textIds: [] })
    expect(countHighlights()).toBe(0)
  } finally {
    await act(async () => root.unmount())
    Object.assign(globalThis, previousGlobals)
    window.close()
  }
})
