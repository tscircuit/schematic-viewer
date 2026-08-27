import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import { JSDOM } from "jsdom"
import { act, useRef } from "react"
import { createRoot } from "react-dom/client"
import { useSchematicNetHover } from "../lib/hooks/useSchematicNetHover"

const circuitJson: CircuitJson = [
  {
    type: "source_trace",
    source_trace_id: "source_trace_signal",
    connected_source_port_ids: [],
    connected_source_net_ids: [],
    subcircuit_connectivity_map_key: "signal_net_key",
  },
  {
    type: "source_trace",
    source_trace_id: "source_trace_other",
    connected_source_port_ids: [],
    connected_source_net_ids: [],
    subcircuit_connectivity_map_key: "other_net_key",
  },
]

test("hovering inline net label highlights its source trace net", async () => {
  const dom = new JSDOM('<div id="root"></div>')
  const previousGlobals = {
    window: globalThis.window,
    document: globalThis.document,
    Element: globalThis.Element,
    Event: globalThis.Event,
    MutationObserver: globalThis.MutationObserver,
  }

  Object.assign(globalThis, {
    window: dom.window,
    document: dom.window.document,
    Element: dom.window.Element,
    Event: dom.window.Event,
    MutationObserver: dom.window.MutationObserver,
    IS_REACT_ACT_ENVIRONMENT: true,
  })

  const Harness = () => {
    const svgDivRef = useRef<HTMLDivElement>(null)
    useSchematicNetHover({
      svgDivRef,
      circuitJson,
      circuitJsonKey: "inline-net-label-hover",
      enabled: true,
    })

    return (
      <div ref={svgDivRef}>
        <svg>
          <g
            id="signal-trace"
            className="trace"
            data-subcircuit-connectivity-map-key="signal_net_key"
          />
          <g
            id="other-trace"
            className="trace"
            data-subcircuit-connectivity-map-key="other_net_key"
          />
          <text
            id="inline-label"
            className="sch-inline-net-label"
            data-source-trace-id="source_trace_signal"
          >
            SIGNAL
          </text>
        </svg>
      </div>
    )
  }

  const reactRoot = createRoot(document.getElementById("root")!)

  try {
    await act(async () => reactRoot.render(<Harness />))

    document
      .getElementById("inline-label")!
      .dispatchEvent(new dom.window.MouseEvent("mouseover", { bubbles: true }))

    expect(document.getElementById("signal-trace")!.classList).not.toContain(
      "sch-net-faded",
    )
    expect(document.getElementById("inline-label")!.classList).not.toContain(
      "sch-net-faded",
    )
    expect(document.getElementById("other-trace")!.classList).toContain(
      "sch-net-faded",
    )
  } finally {
    await act(async () => reactRoot.unmount())
    Object.assign(globalThis, {
      ...previousGlobals,
      IS_REACT_ACT_ENVIRONMENT: false,
    })
    dom.window.close()
  }
})
