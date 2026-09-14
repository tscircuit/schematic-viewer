import { afterAll, beforeAll, expect, spyOn, test } from "bun:test"
import { styleAnalyzerLoader } from "../lib/utils/load-style-analyzer"

let analyzerSpy: ReturnType<typeof spyOn>
beforeAll(() => {
  analyzerSpy = spyOn(styleAnalyzerLoader, "load").mockImplementation(
    () => import("@tscircuit/circuit-json-schematic-placement-analysis"),
  )
})
afterAll(() => analyzerSpy.mockRestore())
import { JSDOM } from "jsdom"
import { createRef, useRef, useState } from "react"
import { act } from "react"
import { createRoot } from "react-dom/client"
import { useContextMenu } from "../lib/hooks/useContextMenu"

const installDom = () => {
  const dom = new JSDOM('<div id="root"></div>', {
    url: "http://localhost",
  })
  const previousGlobals = {
    window: globalThis.window,
    document: globalThis.document,
    Element: globalThis.Element,
    Event: globalThis.Event,
    CustomEvent: globalThis.CustomEvent,
    HTMLElement: globalThis.HTMLElement,
    HTMLInputElement: globalThis.HTMLInputElement,
    MouseEvent: globalThis.MouseEvent,
    MutationObserver: globalThis.MutationObserver,
    Node: globalThis.Node,
    NodeFilter: globalThis.NodeFilter,
    requestAnimationFrame: globalThis.requestAnimationFrame,
    cancelAnimationFrame: globalThis.cancelAnimationFrame,
    ResizeObserver: globalThis.ResizeObserver,
    getComputedStyle: globalThis.getComputedStyle,
  }

  class TestResizeObserver {
    observe() {}
    disconnect() {}
  }
  dom.window.Element.prototype.getBoundingClientRect = () =>
    ({
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: 800,
      bottom: 600,
      width: 800,
      height: 600,
      toJSON: () => {},
    }) as DOMRect
  Object.assign(dom.window, {
    requestAnimationFrame: (callback: FrameRequestCallback) =>
      dom.window.setTimeout(() => callback(Date.now()), 0),
    cancelAnimationFrame: (id: number) => dom.window.clearTimeout(id),
  })

  Object.assign(globalThis, {
    window: dom.window,
    document: dom.window.document,
    Element: dom.window.Element,
    Event: dom.window.Event,
    CustomEvent: dom.window.CustomEvent,
    HTMLElement: dom.window.HTMLElement,
    HTMLInputElement: dom.window.HTMLInputElement,
    MouseEvent: dom.window.MouseEvent,
    MutationObserver: dom.window.MutationObserver,
    Node: dom.window.Node,
    NodeFilter: dom.window.NodeFilter,
    requestAnimationFrame: dom.window.requestAnimationFrame,
    cancelAnimationFrame: dom.window.cancelAnimationFrame,
    ResizeObserver: TestResizeObserver,
    getComputedStyle: dom.window.getComputedStyle,
    IS_REACT_ACT_ENVIRONMENT: true,
  })

  return {
    dom,
    restore: () => {
      Object.assign(globalThis, {
        ...previousGlobals,
        IS_REACT_ACT_ENVIRONMENT: false,
      })
      dom.window.close()
    },
  }
}

const circuitJsonWithPort = [
  {
    type: "source_component",
    source_component_id: "source_component_1",
    name: "R1",
    ftype: "simple_resistor",
  },
  {
    type: "schematic_component",
    schematic_component_id: "schematic_component_1",
    source_component_id: "source_component_1",
    center: { x: 0, y: 0 },
    size: { width: 1, height: 1 },
  },
  {
    type: "source_port",
    source_port_id: "source_port_1",
    source_component_id: "source_component_1",
    name: "pin1",
  },
  {
    type: "schematic_port",
    schematic_port_id: "schematic_port_1",
    source_port_id: "source_port_1",
    center: { x: 0.5, y: 0 },
    facing_direction: "right",
  },
] as any

test("the context menu toggles schematic ports", async () => {
  const { dom, restore } = installDom()
  const reactRoot = createRoot(document.getElementById("root")!)
  const { ViewMenu } = await import("../lib/components/ViewMenu")

  const Harness = () => {
    const [showPorts, setShowPorts] = useState(false)
    return (
      <>
        <ViewMenu
          circuitJson={circuitJsonWithPort}
          circuitJsonKey="ports"
          menuRef={createRef<HTMLDivElement>()}
          menuPos={{ x: 0, y: 0 }}
          onOpenChange={() => {}}
          onRunStyleAnalysis={() => {}}
          showPorts={showPorts}
          onTogglePorts={setShowPorts}
          showGroups={false}
          onToggleGroups={() => {}}
          showWarnings={false}
          onToggleWarnings={() => {}}
          showGrid={false}
          onToggleGrid={() => {}}
        />
        <div data-ports-visible={showPorts} />
      </>
    )
  }

  try {
    await act(async () => reactRoot.render(<Harness />))
    await act(
      () => new Promise<void>((resolve) => dom.window.setTimeout(resolve, 0)),
    )

    const portsLabel = Array.from(document.querySelectorAll("span")).find(
      (element) => element.textContent === "Show Schematic Ports",
    )
    expect(portsLabel).toBeDefined()

    const portsItem = portsLabel!.closest('[role="menuitem"]')!
    await act(async () => {
      portsItem.dispatchEvent(
        new dom.window.Event("pointerdown", {
          bubbles: true,
          cancelable: true,
        }),
      )
    })

    expect(
      document
        .querySelector("[data-ports-visible]")
        ?.getAttribute("data-ports-visible"),
    ).toBe("true")
    expect(portsItem.querySelector("svg")).not.toBeNull()
  } finally {
    await act(async () => reactRoot.unmount())
    await new Promise<void>((resolve) => dom.window.setTimeout(resolve, 0))
    restore()
  }
})

const ContextMenuHarness = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const { menuVisible, menuPos, menuRef, contextMenuEventHandlers } =
    useContextMenu({ containerRef })

  return (
    <div
      ref={containerRef}
      data-context-target
      data-menu-visible={menuVisible}
      data-menu-x={menuPos.x}
      data-menu-y={menuPos.y}
      {...contextMenuEventHandlers}
    >
      {menuVisible && <div ref={menuRef}>Menu</div>}
    </div>
  )
}

test("right click opens the context menu at the pointer", async () => {
  const { dom, restore } = installDom()
  const reactRoot = createRoot(document.getElementById("root")!)

  try {
    await act(async () => reactRoot.render(<ContextMenuHarness />))
    const target = document.querySelector("[data-context-target]")!

    await act(async () => {
      target.dispatchEvent(
        new dom.window.MouseEvent("mousedown", {
          bubbles: true,
          button: 2,
          clientX: 42,
          clientY: 84,
        }),
      )
      target.dispatchEvent(
        new dom.window.MouseEvent("contextmenu", {
          bubbles: true,
          cancelable: true,
          button: 2,
          clientX: 42,
          clientY: 84,
        }),
      )
    })

    expect(target.getAttribute("data-menu-visible")).toBe("true")
    expect(target.getAttribute("data-menu-x")).toBe("42")
    expect(target.getAttribute("data-menu-y")).toBe("84")
  } finally {
    await act(async () => reactRoot.unmount())
    restore()
  }
})

test("a long press opens the context menu on touch devices", async () => {
  const { dom, restore } = installDom()
  const reactRoot = createRoot(document.getElementById("root")!)

  try {
    await act(async () => reactRoot.render(<ContextMenuHarness />))
    const target = document.querySelector("[data-context-target]")!
    target.getBoundingClientRect = () =>
      ({
        x: 10,
        y: 20,
        left: 10,
        top: 20,
        right: 210,
        bottom: 120,
        width: 200,
        height: 100,
        toJSON: () => {},
      }) as DOMRect

    const touchStart = new dom.window.Event("touchstart", {
      bubbles: true,
      cancelable: true,
    })
    Object.defineProperty(touchStart, "touches", {
      value: [{ clientX: 20, clientY: 30 }],
    })

    await act(async () => {
      target.dispatchEvent(touchStart)
      await new Promise<void>((resolve) => dom.window.setTimeout(resolve, 650))
    })

    expect(target.getAttribute("data-menu-visible")).toBe("true")
    expect(target.getAttribute("data-menu-x")).toBe("110")
    expect(target.getAttribute("data-menu-y")).toBe("70")
  } finally {
    await act(async () => reactRoot.unmount())
    restore()
  }
})

test("the warnings menu toggles rendered callouts with mouse and keyboard", async () => {
  const { dom, restore } = installDom()
  const reactRoot = createRoot(document.getElementById("root")!)
  const { SchematicViewer } = await import("../lib/components/SchematicViewer")
  const message = "This component has a manual edit conflict"
  const circuitJson = [
    ...circuitJsonWithPort,
    {
      type: "schematic_manual_edit_conflict_warning",
      schematic_manual_edit_conflict_warning_id: "warning_1",
      schematic_component_id: "schematic_component_1",
      message,
    },
  ]

  try {
    await act(async () =>
      reactRoot.render(<SchematicViewer circuitJson={circuitJson} />),
    )
    expect(document.querySelector("svg")).not.toBeNull()
    expect(document.querySelector(".schematic-warning")).toBeNull()

    const component = document.querySelector(
      '[data-schematic-component-id="schematic_component_1"]',
    )!
    await act(async () => {
      component.dispatchEvent(
        new dom.window.MouseEvent("mousedown", {
          bubbles: true,
          button: 2,
          clientX: 100,
          clientY: 100,
        }),
      )
      component.dispatchEvent(
        new dom.window.MouseEvent("contextmenu", {
          bubbles: true,
          cancelable: true,
          button: 2,
          clientX: 100,
          clientY: 100,
        }),
      )
    })
    await act(
      () => new Promise<void>((resolve) => dom.window.setTimeout(resolve, 0)),
    )

    const item = document.querySelector('[role="menuitemcheckbox"]')!
    expect(item.textContent).toBe("Show Warnings")
    expect(item.getAttribute("aria-checked")).toBe("false")
    await act(async () => {
      item.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }))
    })
    expect(item.getAttribute("aria-checked")).toBe("true")
    expect(
      document.querySelector(".schematic-warning text")?.textContent,
    ).toContain(message)
    expect(
      document.querySelector('[data-warning-reference="target"]'),
    ).not.toBeNull()

    const toggle = document.querySelector<HTMLButtonElement>(
      ".schematic-viewer-toolbar button[aria-expanded]",
    )!
    expect(toggle.textContent).toBe("Minimize warnings")
    await act(async () => toggle.click())
    expect(toggle.getAttribute("aria-expanded")).toBe("false")
    expect(toggle.textContent).toBe("Expand warnings")
    expect(
      getComputedStyle(document.querySelector(".schematic-warning text")!)
        .display,
    ).toBe("none")
    expect(
      getComputedStyle(
        document.querySelector('[data-warning-reference="target"]')!,
      ).display,
    ).not.toBe("none")
    await act(async () => toggle.click())
    expect(toggle.getAttribute("aria-expanded")).toBe("true")
    expect(
      getComputedStyle(document.querySelector(".schematic-warning text")!)
        .display,
    ).not.toBe("none")

    await act(async () => {
      item.dispatchEvent(
        new dom.window.KeyboardEvent("keydown", {
          key: "Enter",
          bubbles: true,
        }),
      )
    })
    expect(item.getAttribute("aria-checked")).toBe("false")
    expect(document.querySelector(".schematic-warning")).toBeNull()
  } finally {
    await act(async () => reactRoot.unmount())
    await new Promise<void>((resolve) => dom.window.setTimeout(resolve, 0))
    restore()
  }
})

test("Run Style Analysis opens real issue SVGs and can be rerun", async () => {
  const { dom, restore } = installDom()
  const reactRoot = createRoot(document.getElementById("root")!)
  const { SchematicViewer } = await import("../lib/components/SchematicViewer")
  const circuitJson = [
    ...circuitJsonWithPort,
    {
      type: "source_component",
      source_component_id: "source_component_2",
      name: "R2",
      ftype: "simple_resistor",
    },
    {
      type: "schematic_component",
      schematic_component_id: "schematic_component_2",
      source_component_id: "source_component_2",
      center: { x: 0.1, y: 0 },
      size: { width: 1, height: 1 },
    },
  ]
  const openAnalysis = async () => {
    const component = document.querySelector(
      '[data-schematic-component-id="schematic_component_1"]',
    )!
    await act(async () => {
      for (const type of ["mousedown", "contextmenu"]) {
        component.dispatchEvent(
          new dom.window.MouseEvent(type, {
            bubbles: true,
            cancelable: true,
            button: 2,
            clientX: 100,
            clientY: 100,
          }),
        )
      }
    })
    const command = Array.from(
      document.querySelectorAll('[role="menuitem"]'),
    ).find((item) => item.textContent === "Run Style Analysis")!
    expect(command).toBeDefined()
    await act(async () =>
      command.dispatchEvent(
        new dom.window.MouseEvent("click", { bubbles: true }),
      ),
    )
    for (
      let i = 0;
      i < 100 &&
      document.querySelector('[role="status"]')?.textContent ===
        "Running style analysis…";
      i++
    ) {
      await act(
        () =>
          new Promise<void>((resolve) => dom.window.setTimeout(resolve, 10)),
      )
    }
  }
  const closeAnalysis = async () => {
    const close = Array.from(document.querySelectorAll("button")).find(
      (button) => button.textContent === "Close",
    )!
    await act(async () => close.click())
    expect(document.querySelector('[role="dialog"]')).toBeNull()
  }
  try {
    await act(async () =>
      reactRoot.render(<SchematicViewer circuitJson={circuitJson} />),
    )
    await openAnalysis()
    const dialog = document.querySelector('[role="dialog"]')!
    expect(dialog).not.toBeNull()
    expect(dialog.textContent).toContain("Component Overlap")
    const images = Array.from(dialog.querySelectorAll("img"))
    expect(images.length).toBeGreaterThan(0)
    expect(decodeURIComponent(images[0]!.src.split(",")[1]!)).toContain("<svg")
    expect(document.querySelector('[role="menu"]')).toBeNull()
    await closeAnalysis()

    await act(async () =>
      reactRoot.render(<SchematicViewer circuitJson={circuitJsonWithPort} />),
    )
    await openAnalysis()
    expect(document.querySelector('[role="dialog"]')?.textContent).toContain(
      "No style issues found.",
    )
    expect(document.querySelector('[role="dialog"] img')).toBeNull()
    await closeAnalysis()
  } finally {
    await act(async () => reactRoot.unmount())
    await new Promise<void>((resolve) => dom.window.setTimeout(resolve, 0))
    restore()
  }
})

test("style analysis reports CDN failures in a dismissible dialog", async () => {
  const { dom, restore } = installDom()
  const reactRoot = createRoot(document.getElementById("root")!)
  const { StyleAnalysisDialog } = await import(
    "../lib/components/StyleAnalysisDialog"
  )
  analyzerSpy.mockRejectedValueOnce(
    new Error("Failed to load the analyzer from the CDN"),
  )
  const Harness = () => {
    const [open, setOpen] = useState(true)
    return open ? (
      <StyleAnalysisDialog
        circuitJson={circuitJsonWithPort}
        onClose={() => setOpen(false)}
      />
    ) : null
  }
  try {
    await act(async () => reactRoot.render(<Harness />))
    for (let i = 0; i < 100 && !document.querySelector('[role="alert"]'); i++) {
      await act(
        () =>
          new Promise<void>((resolve) => dom.window.setTimeout(resolve, 10)),
      )
    }
    expect(document.querySelector('[role="alert"]')?.textContent).toContain(
      "Style analysis failed:",
    )
    await act(async () => document.querySelector("button")!.click())
    expect(document.querySelector('[role="dialog"]')).toBeNull()
  } finally {
    await act(async () => reactRoot.unmount())
    await new Promise<void>((resolve) => dom.window.setTimeout(resolve, 0))
    restore()
  }
})
