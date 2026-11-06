import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import { JSDOM } from "jsdom"
import { act } from "react"
import { createRoot } from "react-dom/client"
import { fromString } from "transformation-matrix"
import sheet25 from "../examples/tmds62levm-sheet-25.circuit.json"
import { SchematicViewer } from "../lib/components/SchematicViewer"

class TestResizeObserver {
  observe() {}
  disconnect() {}
}

test("pans the off-page DQS note while the viewer clips to its viewport", async () => {
  const dom = new JSDOM('<div id="root"></div><svg id="unrelated"></svg>', {
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
  const unrelatedSvg = document.getElementById("unrelated")!
  const unrelatedSvgOverflow = window.getComputedStyle(unrelatedSvg).overflow
  try {
    await act(async () => {
      root.render(
        <SchematicViewer
          circuitJson={sheet25 as CircuitJson}
          netHoverHighlightEnabled={false}
          searchEnabled={false}
        />,
      )
    })

    const svg = document.querySelector(".schematic-component-clickable > svg")
    const note = svg?.querySelector(
      'text[data-schematic-text-id="schematic_text_frame_line_altium_3252_1"]',
    )
    const svgWrapper = svg?.parentElement
    const viewport = svgWrapper?.parentElement
    if (!svg || !note || !svgWrapper || !viewport) {
      throw new Error("Expected the rendered note and its viewer")
    }

    const noteY = Number(note.getAttribute("y"))
    const viewportHeight = viewport.getBoundingClientRect().height
    expect(noteY).toBeGreaterThan(viewportHeight)
    expect(window.getComputedStyle(svg).overflow).toBe("visible")
    expect(window.getComputedStyle(viewport).overflow).toBe("hidden")
    expect(window.getComputedStyle(unrelatedSvg).overflow).toBe(
      unrelatedSvgOverflow,
    )

    const dragPixels = 360
    await act(async () => {
      for (const [type, clientY] of [
        ["mousedown", 670],
        ["mousemove", 670 - dragPixels],
        ["mouseup", 670 - dragPixels],
      ] as const) {
        svg.dispatchEvent(
          new window.MouseEvent(type, { bubbles: true, clientX: 510, clientY }),
        )
      }
    })

    const { f: panY } = fromString(svgWrapper.style.transform)
    expect(panY).toBe(-dragPixels)
    expect(noteY + panY).toBeLessThan(viewportHeight)
    expect(noteY + panY).toBeGreaterThan(0)
  } finally {
    await act(async () => root.unmount())
    Object.assign(globalThis, previousGlobals)
    window.close()
  }
})
