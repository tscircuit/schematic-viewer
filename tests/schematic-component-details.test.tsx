import { expect, test } from "bun:test"
import { getUncompressedSnippetString } from "@tscircuit/create-snippet-url"
import { JSDOM } from "jsdom"
import { act } from "react"
import { createRoot } from "react-dom/client"
import { SchematicViewer } from "../lib/components/SchematicViewer"
import { renderToCircuitJson } from "../lib/dev/render-to-circuit-json"
import {
  getFootprintPreviewUrl,
  getSchematicComponentDetails,
  getSourceComponentInfoEntries,
} from "../lib/utils/component-details"

const circuitJson = renderToCircuitJson(
  <board width="12mm" height="12mm">
    <resistor
      name="R1"
      resistance={1000}
      manufacturerPartNumber="RC0603FR-071KL"
      footprint="0603"
      schX={-2}
    />
    <capacitor name="C1" capacitance="1uF" footprint="0603" schX={2} />
  </board>,
)

const installDom = () => {
  const dom = new JSDOM('<div id="root"></div>', {
    url: "http://localhost",
  })
  const previousGlobals = {
    window: globalThis.window,
    document: globalThis.document,
    Element: globalThis.Element,
    Event: globalThis.Event,
    HTMLElement: globalThis.HTMLElement,
    MouseEvent: globalThis.MouseEvent,
    MutationObserver: globalThis.MutationObserver,
    Node: globalThis.Node,
    ResizeObserver: globalThis.ResizeObserver,
    getComputedStyle: globalThis.getComputedStyle,
  }

  class TestResizeObserver {
    constructor(private callback: ResizeObserverCallback) {}

    observe() {
      this.callback([], this as unknown as ResizeObserver)
    }

    disconnect() {}
  }

  Object.assign(globalThis, {
    window: dom.window,
    document: dom.window.document,
    Element: dom.window.Element,
    Event: dom.window.Event,
    HTMLElement: dom.window.HTMLElement,
    MouseEvent: dom.window.MouseEvent,
    MutationObserver: dom.window.MutationObserver,
    Node: dom.window.Node,
    ResizeObserver: TestResizeObserver,
    getComputedStyle: dom.window.getComputedStyle,
    IS_REACT_ACT_ENVIRONMENT: true,
  })

  Object.assign(dom.window, {
    ResizeObserver: TestResizeObserver,
    requestAnimationFrame: (callback: FrameRequestCallback) =>
      dom.window.setTimeout(() => callback(Date.now()), 0),
    cancelAnimationFrame: (frameId: number) => dom.window.clearTimeout(frameId),
  })

  const originalGetBoundingClientRect =
    dom.window.Element.prototype.getBoundingClientRect
  dom.window.Element.prototype.getBoundingClientRect = function () {
    const schematicComponentId = this.getAttribute(
      "data-schematic-component-id",
    )
    if (schematicComponentId === "schematic_component_0") {
      return {
        x: 280,
        y: 240,
        left: 280,
        top: 240,
        right: 360,
        bottom: 300,
        width: 80,
        height: 60,
        toJSON: () => {},
      } as DOMRect
    }
    if (schematicComponentId) {
      return {
        x: 480,
        y: 240,
        left: 480,
        top: 240,
        right: 560,
        bottom: 300,
        width: 80,
        height: 60,
        toJSON: () => {},
      } as DOMRect
    }
    return {
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: 800,
      bottom: 600,
      width: 800,
      height: 600,
      toJSON: () => {},
    } as DOMRect
  }

  return {
    dom,
    restore: () => {
      dom.window.Element.prototype.getBoundingClientRect =
        originalGetBoundingClientRect
      Object.assign(globalThis, {
        ...previousGlobals,
        IS_REACT_ACT_ENVIRONMENT: false,
      })
      dom.window.close()
    },
  }
}

test("component details include source values and the footprinter string", () => {
  const schematicComponent = circuitJson.find(
    (element) => element.type === "schematic_component",
  )!
  const details = getSchematicComponentDetails(
    circuitJson,
    schematicComponent.schematic_component_id,
  )

  expect(details?.sourceComponent.name).toBe("R1")
  expect(details?.footprinterString).toBe("res0603")
  const resistorInfo = getSourceComponentInfoEntries(details!.sourceComponent)
  expect(resistorInfo).toContainEqual({
    key: "resistance",
    label: "Resistance",
    value: "1kΩ",
  })
  expect(resistorInfo).toContainEqual({
    key: "manufacturer_part_number",
    label: "Manufacturer Part Number",
    value: "RC0603FR-071KL",
  })
  expect(
    resistorInfo.some((entry) => entry.key === "are_pins_interchangeable"),
  ).toBe(false)

  const capacitor = circuitJson.find(
    (element) => element.type === "source_component" && element.name === "C1",
  )!
  expect(getSourceComponentInfoEntries(capacitor)).toContainEqual({
    key: "capacitance",
    label: "Capacitance",
    value: "1uF",
  })
})

test("footprint preview URLs safely encode the footprinter string", () => {
  const footprinterString = 'kicad:Package_SO:SOIC-8_3.9x4.9mm_P1.27mm"test'
  const previewUrl = new URL(getFootprintPreviewUrl(footprinterString))
  const generatedCode = getUncompressedSnippetString(
    previewUrl.searchParams.get("code")!,
  )

  expect(previewUrl.origin).toBe("https://svg.tscircuit.com")
  expect(previewUrl.searchParams.get("svg_type")).toBe("pcb")
  expect(previewUrl.searchParams.get("background_color")).toBe("#f8fafc")
  expect(generatedCode).toContain(
    `footprint={${JSON.stringify(footprinterString)}}`,
  )
})

test("clicking a component opens its details without requiring a callback", async () => {
  const { dom, restore } = installDom()
  const reactRoot = createRoot(document.getElementById("root")!)

  try {
    await act(async () => {
      reactRoot.render(
        <SchematicViewer
          circuitJson={circuitJson}
          containerStyle={{ width: 800, height: 600 }}
        />,
      )
    })
    await act(
      () => new Promise<void>((resolve) => dom.window.setTimeout(resolve, 10)),
    )

    const component = document.querySelector(
      '[data-schematic-component-id="schematic_component_0"]',
    )!
    expect(component).not.toBeNull()

    await act(async () => {
      component.dispatchEvent(
        new dom.window.MouseEvent("mousedown", {
          bubbles: true,
          clientX: 320,
          clientY: 270,
        }),
      )
      component.dispatchEvent(
        new dom.window.MouseEvent("click", {
          bubbles: true,
          clientX: 320,
          clientY: 270,
        }),
      )
    })

    const tooltip = document.querySelector(
      "[data-schematic-component-details-tooltip]",
    )
    expect(tooltip).not.toBeNull()
    expect(tooltip?.textContent).toContain("R1")
    expect(tooltip?.textContent).toContain("1kΩ")
    expect(tooltip?.textContent).toContain("RC0603FR-071KL")
    expect(tooltip?.textContent).toContain("res0603")
    expect(tooltip?.querySelector("img")?.getAttribute("src")).toContain(
      "https://svg.tscircuit.com/",
    )

    await act(async () => {
      document.body.dispatchEvent(
        new dom.window.MouseEvent("mousedown", { bubbles: true }),
      )
    })
    expect(
      document.querySelector("[data-schematic-component-details-tooltip]"),
    ).toBeNull()
  } finally {
    await act(async () => reactRoot.unmount())
    await new Promise<void>((resolve) => dom.window.setTimeout(resolve, 0))
    restore()
  }
})
