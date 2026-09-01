import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import { JSDOM } from "jsdom"
import { act, useRef } from "react"
import { createRoot } from "react-dom/client"
import { SchematicTraceNetTooltip } from "../lib/components/SchematicTraceNetTooltip"
import { useSchematicNetHover } from "../lib/hooks/useSchematicNetHover"

const circuitJson: CircuitJson = [
  {
    type: "source_net",
    source_net_id: "source_net_vcc",
    name: "VCC",
    member_source_group_ids: [],
    subcircuit_connectivity_map_key: "net_vcc",
  },
  {
    type: "source_trace",
    source_trace_id: "source_trace_vcc",
    connected_source_port_ids: [],
    connected_source_net_ids: ["source_net_vcc"],
    subcircuit_connectivity_map_key: "net_vcc",
  },
]

const Harness = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const svgDivRef = useRef<HTMLDivElement>(null)
  const hoveredTrace = useSchematicNetHover({
    svgDivRef,
    containerRef,
    circuitJson,
    circuitJsonKey: "trace-tooltip",
    enabled: true,
  })

  return (
    <div ref={containerRef}>
      <div ref={svgDivRef} data-svg-container>
        <svg>
          <g className="trace" data-subcircuit-connectivity-map-key="net_vcc">
            <path data-trace-path />
          </g>
        </svg>
      </div>
      {hoveredTrace && <SchematicTraceNetTooltip hoveredTrace={hoveredTrace} />}
    </div>
  )
}

test("reports a trace net name and pointer position on hover", async () => {
  const dom = new JSDOM('<div id="root"></div>')
  const previousGlobals = {
    window: globalThis.window,
    document: globalThis.document,
    Element: globalThis.Element,
    MouseEvent: globalThis.MouseEvent,
    MutationObserver: globalThis.MutationObserver,
  }

  Object.assign(globalThis, {
    window: dom.window,
    document: dom.window.document,
    Element: dom.window.Element,
    MouseEvent: dom.window.MouseEvent,
    MutationObserver: dom.window.MutationObserver,
    IS_REACT_ACT_ENVIRONMENT: true,
  })

  const reactRoot = createRoot(document.getElementById("root")!)

  try {
    await act(async () => reactRoot.render(<Harness />))
    const container = document.querySelector("#root > div")!
    container.getBoundingClientRect = () =>
      ({
        left: 10,
        top: 20,
        right: 210,
        bottom: 120,
        width: 200,
        height: 100,
        x: 10,
        y: 20,
        toJSON: () => {},
      }) as DOMRect

    await act(async () => {
      document.querySelector("[data-trace-path]")!.dispatchEvent(
        new dom.window.MouseEvent("mouseover", {
          bubbles: true,
          clientX: 42,
          clientY: 84,
        }),
      )
    })

    const tooltip = document.querySelector(
      "[data-schematic-trace-net-tooltip]",
    ) as HTMLDivElement
    expect(tooltip.textContent).toBe("VCC")
    expect(tooltip.style.left).toBe("44px")
    expect(tooltip.style.top).toBe("76px")

    await act(async () => {
      document
        .querySelector("[data-svg-container]")!
        .dispatchEvent(new dom.window.MouseEvent("mouseleave"))
    })
    expect(
      document.querySelector("[data-schematic-trace-net-tooltip]"),
    ).toBeNull()
  } finally {
    await act(async () => reactRoot.unmount())
    Object.assign(globalThis, {
      ...previousGlobals,
      IS_REACT_ACT_ENVIRONMENT: false,
    })
    dom.window.close()
  }
})
