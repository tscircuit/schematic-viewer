import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import { gunzipSync, strFromU8 } from "fflate"
import { JSDOM } from "jsdom"
import { act } from "react"
import { createRoot } from "react-dom/client"
import { SchematicViewer } from "../lib/components/SchematicViewer"
import { renderToCircuitJson } from "../lib/dev/render-to-circuit-json"
import {
  type SourceComponent,
  getFootprintPreviewUrl,
  getPcbComponentPreview,
  getSchematicComponentDetails,
  getSourceComponentInfoEntries,
  getSupplierPartNumberEntries,
} from "../lib/utils/component-details"

const renderedCircuitJson = renderToCircuitJson(
  <board width="12mm" height="12mm">
    <resistor
      name="R1"
      resistance={1000}
      manufacturerPartNumber="RC0603FR-071KL"
      supplierPartNumbers={{
        jlcpcb: ["C2040", "2040"],
        lcsc: ["C2040"],
        mouser: ["123-EXAMPLE"],
      }}
      footprint="0603"
      schX={-2}
      pcbX={-2}
    />
    <capacitor name="C1" capacitance="1uF" footprint="0603" schX={2} pcbX={2} />
  </board>,
)

const circuitJson: CircuitJson = [
  ...renderedCircuitJson,
  {
    type: "pcb_trace",
    pcb_trace_id: "pcb_trace_preview_context",
    route: [
      { route_type: "wire", x: -6, y: 0, width: 0.15, layer: "top" },
      { route_type: "wire", x: 6, y: 0, width: 0.15, layer: "top" },
    ],
  },
]

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
  expect(resistorInfo[0]).toEqual({
    key: "name",
    label: "name",
    value: "R1",
  })
  expect(resistorInfo).toContainEqual({
    key: "resistance",
    label: "resistance",
    value: '"1k"',
  })
  expect(resistorInfo).toContainEqual({
    key: "manufacturer_part_number",
    label: "manufacturer_part_number",
    value: '"RC0603FR-071KL"',
  })
  expect(
    resistorInfo.some((entry) => entry.key === "are_pins_interchangeable"),
  ).toBe(false)
  expect(
    resistorInfo.some((entry) => entry.key === "supplier_part_numbers"),
  ).toBe(false)
  expect(getSupplierPartNumberEntries(details!.sourceComponent)).toEqual([
    {
      key: "supplier_part_numbers.jlcpcb",
      label: "jlcpcb",
      links: [
        {
          partNumber: "C2040",
          href: "https://jlcpcb.com/partdetail/C2040",
        },
      ],
    },
    {
      key: "supplier_part_numbers.lcsc",
      label: "lcsc",
      links: [
        {
          partNumber: "C2040",
          href: "https://www.lcsc.com/product-detail/C2040.html",
        },
      ],
    },
  ])

  const capacitor = circuitJson.find(
    (element): element is SourceComponent =>
      element.type === "source_component" &&
      element.ftype === "simple_capacitor" &&
      element.name === "C1",
  )!
  expect(getSourceComponentInfoEntries(capacitor)).toContainEqual({
    key: "capacitance",
    label: "capacitance",
    value: '"1uF"',
  })
})

test("footprint previews use the selected component's actual PCB elements", () => {
  const details = getSchematicComponentDetails(
    circuitJson,
    "schematic_component_0",
  )!
  const preview = getPcbComponentPreview(
    circuitJson,
    details.pcbComponent!.pcb_component_id,
  )!
  const previewUrl = new URL(
    getFootprintPreviewUrl(preview.circuitJson, preview.viewBox),
  )
  const compressedCircuitJson = Uint8Array.from(
    atob(previewUrl.searchParams.get("circuit_json")!),
    (character) => character.charCodeAt(0),
  )
  const decodedCircuitJson = JSON.parse(
    strFromU8(gunzipSync(compressedCircuitJson)),
  )

  expect(previewUrl.origin).toBe("https://svg.tscircuit.com")
  expect(previewUrl.searchParams.get("svg_type")).toBe("pcb")
  expect(previewUrl.searchParams.get("background_color")).toBe("#f8fafc")
  expect(previewUrl.searchParams.get("viewbox")).toBe(
    [
      preview.viewBox.minX,
      preview.viewBox.minY,
      preview.viewBox.maxX,
      preview.viewBox.maxY,
    ].join(","),
  )
  expect(decodedCircuitJson).toEqual(preview.circuitJson)
  expect(preview.circuitJson).toContainEqual(
    expect.objectContaining({
      type: "pcb_silkscreen_text",
      pcb_component_id: details.pcbComponent!.pcb_component_id,
      text: "R1",
    }),
  )
  expect(preview.circuitJson).toContainEqual(
    expect.objectContaining({ type: "pcb_board" }),
  )
  expect(preview.circuitJson).toContainEqual(
    expect.objectContaining({
      type: "pcb_trace",
      pcb_trace_id: "pcb_trace_preview_context",
    }),
  )
  const capacitor = circuitJson.find(
    (element): element is SourceComponent =>
      element.type === "source_component" && element.name === "C1",
  )!
  expect(preview.circuitJson).toContainEqual(
    expect.objectContaining({
      type: "pcb_component",
      source_component_id: capacitor.source_component_id,
    }),
  )
})

test("component details use compact styling and close on zoom or outside click", async () => {
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
    expect((tooltip as HTMLElement).style.borderRadius).toBe("4px")
    expect((tooltip?.firstElementChild as HTMLElement).style.padding).toBe(
      "8px",
    )
    const nameLabel = Array.from(tooltip?.querySelectorAll("dt") ?? []).find(
      (element) => element.textContent === "name",
    )
    expect(nameLabel?.nextElementSibling?.textContent).toBe("R1")
    expect(tooltip?.firstElementChild?.tagName).toBe("DL")
    expect(tooltip?.querySelector("button")).toBeNull()
    expect(tooltip?.textContent).not.toContain("Resistor")
    expect(tooltip?.textContent).toContain('"1k"')
    expect(tooltip?.textContent).toContain("RC0603FR-071KL")
    expect(tooltip?.textContent).not.toContain("supplier_part_numbers")
    expect(tooltip?.textContent).toContain("res0603")
    const supplierLinks = Array.from(tooltip?.querySelectorAll("a") ?? [])
    expect(supplierLinks).toHaveLength(2)
    expect(supplierLinks.map((link) => link.textContent)).toEqual([
      "C2040",
      "C2040",
    ])
    expect(supplierLinks.map((link) => link.getAttribute("href"))).toEqual([
      "https://jlcpcb.com/partdetail/C2040",
      "https://www.lcsc.com/product-detail/C2040.html",
    ])
    expect(
      supplierLinks.every(
        (link) =>
          link.getAttribute("target") === "_blank" &&
          link.getAttribute("rel") === "noreferrer noopener",
      ),
    ).toBe(true)
    expect(tooltip?.querySelector("img")?.getAttribute("src")).toContain(
      "https://svg.tscircuit.com/",
    )
    expect(tooltip?.querySelector("img")?.getAttribute("alt")).toBe(
      "R1 res0603 PCB footprint",
    )
    expect(
      (tooltip?.querySelector("img")?.parentElement as HTMLElement).style
        .borderRadius,
    ).toBe("2px")

    const viewerContainer = tooltip?.parentElement
    await act(async () => {
      viewerContainer?.dispatchEvent(
        new dom.window.WheelEvent("wheel", {
          bubbles: true,
          clientX: 320,
          clientY: 270,
          deltaY: -100,
        }),
      )
    })
    expect(
      document.querySelector("[data-schematic-component-details-tooltip]"),
    ).toBeNull()

    await act(async () => {
      component.dispatchEvent(
        new dom.window.MouseEvent("click", {
          bubbles: true,
          clientX: 320,
          clientY: 270,
        }),
      )
    })
    expect(
      document.querySelector("[data-schematic-component-details-tooltip]"),
    ).not.toBeNull()

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

test("PCB navigation is offered for represented components and emits resolved IDs", async () => {
  const { dom, restore } = installDom()
  const reactRoot = createRoot(document.getElementById("root")!)
  const navigationEvents: Array<{
    schematicComponentId: string
    sourceComponentId: string
    pcbComponentId: string
  }> = []

  try {
    await act(async () => {
      reactRoot.render(
        <SchematicViewer
          circuitJson={circuitJson}
          containerStyle={{ width: 800, height: 600 }}
          onNavigateToPcbComponent={(options) => navigationEvents.push(options)}
        />,
      )
    })
    await act(
      () => new Promise<void>((resolve) => dom.window.setTimeout(resolve, 10)),
    )

    const component = document.querySelector(
      '[data-schematic-component-id="schematic_component_0"]',
    )!
    await act(async () => {
      component.dispatchEvent(
        new dom.window.MouseEvent("click", {
          bubbles: true,
          clientX: 320,
          clientY: 270,
        }),
      )
    })

    const button = Array.from(document.querySelectorAll("button")).find(
      (element) => element.textContent === "Go to PCB View",
    )
    expect(button).not.toBeNull()
    expect(button?.style.fontSize).toBe("12px")
    expect(button?.style.padding).toBe("4px 8px")
    expect(button?.style.backgroundColor).toBe("rgb(248, 250, 252)")
    expect(button?.parentElement?.style.justifyContent).toBe("flex-end")

    await act(async () => {
      button?.dispatchEvent(
        new dom.window.MouseEvent("mousedown", { bubbles: true }),
      )
      button?.dispatchEvent(
        new dom.window.MouseEvent("click", { bubbles: true }),
      )
    })

    const details = getSchematicComponentDetails(
      circuitJson,
      "schematic_component_0",
    )!
    expect(navigationEvents).toEqual([
      {
        schematicComponentId: details.schematicComponent.schematic_component_id,
        sourceComponentId: details.sourceComponent.source_component_id,
        pcbComponentId: details.pcbComponent!.pcb_component_id,
      },
    ])
  } finally {
    await act(async () => reactRoot.unmount())
    await new Promise<void>((resolve) => dom.window.setTimeout(resolve, 0))
    restore()
  }
})

test("PCB navigation is hidden when a component has no PCB representation", async () => {
  const { dom, restore } = installDom()
  const reactRoot = createRoot(document.getElementById("root")!)
  const details = getSchematicComponentDetails(
    circuitJson,
    "schematic_component_0",
  )!
  const circuitWithoutPcbComponent = circuitJson.filter(
    (element) =>
      !(
        element.type === "pcb_component" &&
        element.pcb_component_id === details.pcbComponent!.pcb_component_id
      ),
  )

  try {
    await act(async () => {
      reactRoot.render(
        <SchematicViewer
          circuitJson={circuitWithoutPcbComponent}
          containerStyle={{ width: 800, height: 600 }}
          onNavigateToPcbComponent={() => {}}
        />,
      )
    })
    await act(
      () => new Promise<void>((resolve) => dom.window.setTimeout(resolve, 10)),
    )

    const component = document.querySelector(
      '[data-schematic-component-id="schematic_component_0"]',
    )!
    await act(async () => {
      component.dispatchEvent(
        new dom.window.MouseEvent("click", {
          bubbles: true,
          clientX: 320,
          clientY: 270,
        }),
      )
    })

    expect(
      Array.from(document.querySelectorAll("button")).some(
        (element) => element.textContent === "Go to PCB View",
      ),
    ).toBe(false)
  } finally {
    await act(async () => reactRoot.unmount())
    await new Promise<void>((resolve) => dom.window.setTimeout(resolve, 0))
    restore()
  }
})
