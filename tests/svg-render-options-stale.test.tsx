import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import { JSDOM } from "jsdom"
import { act } from "react"
import { createRoot } from "react-dom/client"
import { SchematicViewer } from "../lib/components/SchematicViewer"

class TestResizeObserver {
  observe() {}
  disconnect() {}
}

const schematicText = (text: string) =>
  [
    {
      type: "schematic_text",
      schematic_text_id: "schematic_text_1",
      text,
      position: { x: 0, y: 0 },
      rotation: 0,
      anchor: "center",
    },
  ] as unknown as CircuitJson

const renderViewer = async () => {
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
    ResizeObserver: TestResizeObserver,
    IS_REACT_ACT_ENVIRONMENT: true,
  }
  const previousGlobals = Object.fromEntries(
    Object.keys(globals).map((key) => [key, Reflect.get(globalThis, key)]),
  )
  Object.assign(globalThis, globals)
  window.Element.prototype.getBoundingClientRect = () =>
    new window.DOMRect(0, 0, 1024, 768)

  const root = createRoot(document.getElementById("root")!)
  return { dom, document, root, previousGlobals }
}

const svgHtml = (document: Document) =>
  document.querySelector(".schematic-component-clickable")?.innerHTML ?? ""

test("re-renders the schematic SVG when the css option prop changes", async () => {
  const { dom, document, root, previousGlobals } = await renderViewer()
  try {
    await act(async () => {
      root.render(
        <SchematicViewer
          circuitJson={schematicText("HELLO")}
          netHoverHighlightEnabled={false}
          searchEnabled={false}
          css=".first-rule{fill:red}"
        />,
      )
    })
    expect(svgHtml(document)).toContain(".first-rule{fill:red}")

    await act(async () => {
      root.render(
        <SchematicViewer
          circuitJson={schematicText("HELLO")}
          netHoverHighlightEnabled={false}
          searchEnabled={false}
          css=".second-rule{fill:blue}"
        />,
      )
    })
    expect(svgHtml(document)).toContain(".second-rule{fill:blue}")
  } finally {
    await act(async () => root.unmount())
    Object.assign(globalThis, previousGlobals)
    dom.window.close()
  }
})

test("re-renders the schematic SVG when a same-length circuitJson replaces the old one", async () => {
  const { dom, document, root, previousGlobals } = await renderViewer()
  try {
    await act(async () => {
      root.render(
        <SchematicViewer
          circuitJson={schematicText("HELLO")}
          netHoverHighlightEnabled={false}
          searchEnabled={false}
        />,
      )
    })
    expect(svgHtml(document)).toContain("HELLO")

    await act(async () => {
      root.render(
        <SchematicViewer
          circuitJson={schematicText("WORLD")}
          netHoverHighlightEnabled={false}
          searchEnabled={false}
        />,
      )
    })
    expect(svgHtml(document)).toContain("WORLD")
  } finally {
    await act(async () => root.unmount())
    Object.assign(globalThis, previousGlobals)
    dom.window.close()
  }
})
