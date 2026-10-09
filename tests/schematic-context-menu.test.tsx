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
import { getPcbComponentAtElement } from "../lib/utils/get-pcb-component-at-element"

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

test("PCB navigation resolves reference labels and both port ID formats", () => {
  const { dom, restore } = installDom()
  const circuitJson = [
    ...circuitJsonWithPort,
    {
      type: "schematic_text",
      schematic_text_id: "text_1",
      schematic_component_id: "schematic_component_1",
    },
    {
      type: "schematic_port",
      schematic_port_id: "schematic_port_2",
      source_port_id: "source_port_2",
      schematic_component_id: "schematic_component_1",
    },
    {
      type: "pcb_component",
      pcb_component_id: "pcb_component_1",
      source_component_id: "source_component_1",
    },
  ] as any
  try {
    for (const [attribute, id] of [
      ["data-schematic-component-id", "schematic_component_1"],
      ["data-schematic-text-id", "text_1"],
      ["data-schematic-port-id", "schematic_port_2"],
      ["data-schematic-port-id", "source_port_2"],
    ]) {
      const parent = document.createElement("div")
      parent.setAttribute(attribute!, id!)
      const child = parent.appendChild(document.createElement("span"))
      expect(getPcbComponentAtElement(child, circuitJson)).toEqual({
        source_component_id: "source_component_1",
        schematic_component_id: "schematic_component_1",
        pcb_component_id: "pcb_component_1",
        refdes: "R1",
      })
    }
    expect(getPcbComponentAtElement(null, circuitJson)).toBeUndefined()
    expect(getPcbComponentAtElement(document.body, circuitJson)).toBeUndefined()
    const unknown = document.createElement("div")
    unknown.setAttribute("data-schematic-component-id", "unknown")
    expect(getPcbComponentAtElement(unknown, circuitJson)).toBeUndefined()
  } finally {
    restore()
  }
})

test("Show on PCB navigates from the right-clicked component and closes the menu", async () => {
  const { dom, restore } = installDom()
  const reactRoot = createRoot(document.getElementById("root")!)
  const { SchematicViewer } = await import("../lib/components/SchematicViewer")
  const circuitJson = [
    ...circuitJsonWithPort,
    {
      type: "pcb_component",
      pcb_component_id: "pcb_component_1",
      source_component_id: "source_component_1",
      center: { x: 10, y: 20 },
      width: 2,
      height: 1,
      layer: "top",
      rotation: 0,
    },
  ] as any
  const selected: unknown[] = []
  const getAction = () =>
    Array.from(document.querySelectorAll('[role="menuitem"]')).find((element) =>
      element.textContent?.includes("Show on PCB"),
    )
  const openMenu = async (target: Element) => {
    await act(async () => {
      for (const type of ["mousedown", "contextmenu"]) {
        target.dispatchEvent(
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
    await act(
      () => new Promise<void>((resolve) => dom.window.setTimeout(resolve, 0)),
    )
  }
  try {
    await act(async () =>
      reactRoot.render(<SchematicViewer circuitJson={circuitJson} />),
    )
    const component = document.querySelector(
      '[data-schematic-component-id="schematic_component_1"]',
    )!
    await openMenu(component)
    expect(getAction()).toBeUndefined()
    expect(document.querySelector('[role="menu"]')).toBeNull()

    await act(async () =>
      reactRoot.render(
        <SchematicViewer
          circuitJson={circuitJson}
          onViewPcbComponent={(event) => selected.push(event)}
        />,
      ),
    )
    for (const activation of ["click", "keyboard"]) {
      // A child of the SVG group must resolve to the same component.
      await openMenu(component.firstElementChild ?? component)
      const action = getAction()!
      expect(action).toBeDefined()
      expect(
        Array.from(document.querySelectorAll('[role^="menuitem"]')).map(
          (element) => element.textContent,
        ),
      ).toEqual(["↗Show on PCB"])
      expect(document.querySelector('[role="separator"]')).toBeNull()
      await act(async () => {
        action.dispatchEvent(
          activation === "click"
            ? new dom.window.MouseEvent("click", { bubbles: true })
            : new dom.window.KeyboardEvent("keydown", {
                key: "Enter",
                bubbles: true,
              }),
        )
      })
      expect(document.querySelector('[role="menu"]')).toBeNull()
    }
    expect(selected).toEqual([
      {
        source_component_id: "source_component_1",
        schematic_component_id: "schematic_component_1",
        pcb_component_id: "pcb_component_1",
        refdes: "R1",
      },
      {
        source_component_id: "source_component_1",
        schematic_component_id: "schematic_component_1",
        pcb_component_id: "pcb_component_1",
        refdes: "R1",
      },
    ])

    await openMenu(document.querySelector("svg")!)
    expect(getAction()).toBeUndefined()
    for (const label of [
      "Show Schematic Ports",
      "View Schematic Groups",
      "Show Grid",
      "Show Warnings",
      "Run Style Analysis",
    ]) {
      expect(document.querySelector('[role="menu"]')?.textContent).toContain(
        label,
      )
    }
    await act(async () =>
      reactRoot.render(
        <SchematicViewer
          circuitJson={circuitJsonWithPort}
          onViewPcbComponent={(event) => selected.push(event)}
        />,
      ),
    )
    await openMenu(
      document.querySelector(
        '[data-schematic-component-id="schematic_component_1"]',
      )!,
    )
    expect(getAction()).toBeUndefined()
    expect(document.querySelector('[role="menu"]')).toBeNull()
    expect(selected).toHaveLength(2)
  } finally {
    await act(async () => reactRoot.unmount())
    await new Promise<void>((resolve) => dom.window.setTimeout(resolve, 0))
    restore()
  }
})

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
    {
      type: "schematic_manual_edit_conflict_warning",
      schematic_manual_edit_conflict_warning_id: "warning_2",
      schematic_component_id: "schematic_component_1",
      message: "Another independent warning",
    },
  ]

  try {
    await act(async () =>
      reactRoot.render(<SchematicViewer circuitJson={circuitJson} />),
    )
    expect(document.querySelector("svg")).not.toBeNull()
    expect(document.querySelector(".schematic-warning")).toBeNull()

    const component = document.querySelector("svg")!
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
      document
        .querySelector("[data-schematic-warnings]")
        ?.getAttribute("aria-pressed"),
    ).toBe("true")
    expect(
      document.querySelector(".schematic-warning text")?.textContent,
    ).toContain(message)
    expect(
      document.querySelector('[data-warning-reference="target"]'),
    ).not.toBeNull()

    const warning = document.querySelector<SVGGElement>(
      '[data-warning-id="warning_1"]',
    )!
    const otherWarning = document.querySelector<SVGGElement>(
      '[data-warning-id="warning_2"]',
    )!
    const click = (element: Element) =>
      element.dispatchEvent(
        new dom.window.MouseEvent("click", { bubbles: true }),
      )
    expect(warning.getAttribute("role")).toBe("button")
    expect(warning.getAttribute("tabindex")).toBe("0")
    expect(getComputedStyle(warning).cursor).toBe("pointer")
    expect(warning.style.outline).toBe("none")
    await act(async () => {
      click(warning.querySelector("text")!)
    })
    expect(warning.getAttribute("aria-expanded")).toBe("false")
    expect(otherWarning.getAttribute("aria-expanded")).toBe("true")
    expect(getComputedStyle(warning.querySelector("text")!).display).toBe(
      "none",
    )
    const icon = warning.querySelector<SVGGElement>("[data-warning-icon]")!
    expect(getComputedStyle(icon).display).not.toBe("none")
    expect(icon.textContent).toBe("!")
    await act(async () => {
      click(icon)
    })
    expect(warning.getAttribute("aria-expanded")).toBe("true")
    expect(getComputedStyle(warning.querySelector("text")!).display).not.toBe(
      "none",
    )
    for (const key of ["Enter", " "]) {
      await act(async () => {
        warning.dispatchEvent(
          new dom.window.KeyboardEvent("keydown", { key, bubbles: true }),
        )
      })
    }
    expect(warning.getAttribute("aria-expanded")).toBe("true")
    await act(async () => {
      click(warning)
    })

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
    await act(async () => {
      click(item)
    })
    const restored = document.querySelector('[data-warning-id="warning_1"]')!
    expect(restored.getAttribute("aria-expanded")).toBe("false")
    expect(restored.querySelectorAll("[data-warning-icon]")).toHaveLength(1)
    expect(
      document
        .querySelector('[data-warning-id="warning_2"]')!
        .getAttribute("aria-expanded"),
    ).toBe("true")
  } finally {
    await act(async () => reactRoot.unmount())
    await new Promise<void>((resolve) => dom.window.setTimeout(resolve, 0))
    restore()
  }
})

test("warning toolbar counts schematic warnings and toggles their callouts", async () => {
  const { dom, restore } = installDom()
  const reactRoot = createRoot(document.getElementById("root")!)
  const { SchematicViewer } = await import("../lib/components/SchematicViewer")
  const warnings = [1, 2].map((id) => ({
    type: "schematic_manual_edit_conflict_warning",
    schematic_manual_edit_conflict_warning_id: `warning_${id}`,
    schematic_component_id: "schematic_component_1",
    message: `Manual edit conflict ${id}`,
  }))
  const pcbWarning = {
    type: "pcb_manual_edit_conflict_warning",
    pcb_manual_edit_conflict_warning_id: "pcb_warning_1",
    pcb_component_id: "pcb_component_1",
    message: "PCB warning",
  }

  try {
    await act(async () =>
      reactRoot.render(
        <SchematicViewer circuitJson={[...circuitJsonWithPort, pcbWarning]} />,
      ),
    )
    expect(document.querySelector("[data-schematic-warnings]")).toBeNull()

    await act(async () =>
      reactRoot.render(
        <SchematicViewer
          circuitJson={[...circuitJsonWithPort, pcbWarning, ...warnings]}
        />,
      ),
    )
    const button = document.querySelector("[data-schematic-warnings]")!
    expect(button.textContent).toBe("2")
    expect(button.getAttribute("aria-label")).toBe("Show 2 warnings")
    expect(button.getAttribute("aria-pressed")).toBe("false")
    expect(
      button.previousElementSibling?.hasAttribute("data-schematic-search"),
    ).toBe(true)
    expect(document.querySelector(".schematic-warning")).toBeNull()

    await act(async () => {
      button.dispatchEvent(
        new dom.window.MouseEvent("click", { bubbles: true }),
      )
    })
    expect(button.getAttribute("aria-pressed")).toBe("true")
    expect(button.getAttribute("aria-label")).toBe("Hide 2 warnings")
    expect(document.querySelector(".schematic-warning")).not.toBeNull()

    await act(async () => {
      button.dispatchEvent(
        new dom.window.MouseEvent("click", { bubbles: true }),
      )
    })
    expect(button.getAttribute("aria-pressed")).toBe("false")
    expect(document.querySelector(".schematic-warning")).toBeNull()

    await act(async () =>
      reactRoot.render(
        <SchematicViewer
          circuitJson={[...circuitJsonWithPort, warnings[0]!]}
          searchEnabled={false}
        />,
      ),
    )
    expect(button.textContent).toBe("1")
    expect(button.getAttribute("aria-label")).toBe("Show 1 warning")

    await act(async () =>
      reactRoot.render(<SchematicViewer circuitJson={circuitJsonWithPort} />),
    )
    expect(document.querySelector("[data-schematic-warnings]")).toBeNull()
  } finally {
    await act(async () => reactRoot.unmount())
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
    const component = document.querySelector("svg")!
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

test("style analysis reports module loading failures in a dismissible dialog", async () => {
  const { dom, restore } = installDom()
  const reactRoot = createRoot(document.getElementById("root")!)
  const { StyleAnalysisDialog } = await import(
    "../lib/components/StyleAnalysisDialog"
  )
  analyzerSpy.mockRejectedValueOnce(
    new Error("Failed to load the analyzer module"),
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

test("net text highlights nearby and the locations submenu selects a destination", async () => {
  const { dom, restore } = installDom()
  const reactRoot = createRoot(document.getElementById("root")!)
  const { useSchematicNetHover } = await import(
    "../lib/hooks/useSchematicNetHover"
  )
  const { ViewMenu } = await import("../lib/components/ViewMenu")
  const selected: string[] = []
  const Harness = () => {
    const svgDivRef = useRef<HTMLDivElement>(null)
    useSchematicNetHover({
      svgDivRef,
      circuitJsonKey: "net-text",
      enabled: true,
      circuitJson: [
        {
          type: "source_trace",
          source_trace_id: "source",
          connected_source_port_ids: [],
          connected_source_net_ids: [],
          subcircuit_connectivity_map_key: "power",
        },
        {
          type: "schematic_text",
          schematic_text_id: "text",
          source_trace_id: "source",
          text: "PWR",
          position: { x: 0, y: 0 },
        },
      ] as any,
    })
    return (
      <>
        <div ref={svgDivRef}>
          <svg>
            <g className="trace" data-subcircuit-connectivity-map-key="power" />
            <g className="trace" data-subcircuit-connectivity-map-key="other" />
            <text data-schematic-text-id="text">PWR</text>
            <rect data-background="true" />
          </svg>
        </div>
        <ViewMenu
          circuitJson={[]}
          circuitJsonKey="net-menu"
          menuRef={createRef()}
          menuPos={{ x: 0, y: 0 }}
          onOpenChange={() => {}}
          onRunStyleAnalysis={() => {}}
          showPorts={false}
          onTogglePorts={() => {}}
          showGroups={false}
          onToggleGroups={() => {}}
          showWarnings={false}
          onToggleWarnings={() => {}}
          showGrid={false}
          onToggleGrid={() => {}}
          netLocations={[
            {
              kind: "net",
              label: "Sheet 3: J1.ETC",
              schematicSheetId: "s3",
              target: { type: "schematic_trace", id: "trace3" },
            },
          ]}
          onSelectNetLocation={(location) => selected.push(location.target.id)}
        />
      </>
    )
  }
  try {
    await act(async () => reactRoot.render(<Harness />))
    const text = document.querySelector('[data-schematic-text-id="text"]')!
    text.getBoundingClientRect = () =>
      ({
        left: 100,
        right: 140,
        top: 100,
        bottom: 120,
        width: 40,
        height: 20,
      }) as DOMRect
    const background = document.querySelector("[data-background]")!
    await act(async () => {
      background.dispatchEvent(
        new dom.window.MouseEvent("mousemove", {
          bubbles: true,
          clientX: 96,
          clientY: 110,
        }),
      )
    })
    expect(
      document
        .querySelector('[data-subcircuit-connectivity-map-key="other"]')!
        .classList.contains("sch-net-faded"),
    ).toBe(true)
    expect(
      document
        .querySelector('[data-subcircuit-connectivity-map-key="power"]')!
        .classList.contains("sch-net-faded"),
    ).toBe(false)
    await act(async () => {
      background.dispatchEvent(
        new dom.window.MouseEvent("mousemove", {
          bubbles: true,
          clientX: 80,
          clientY: 110,
        }),
      )
    })
    expect(document.querySelector(".sch-net-faded")).toBeNull()
    const trigger = Array.from(
      document.querySelectorAll('[role="menuitem"]'),
    ).find((e) => e.textContent?.includes("Net Locations"))!
    await act(async () => {
      trigger.dispatchEvent(
        new dom.window.KeyboardEvent("keydown", {
          key: "ArrowRight",
          bubbles: true,
        }),
      )
    })
    const destination = Array.from(
      document.querySelectorAll('[role="menuitem"]'),
    ).find((e) => e.textContent === "Sheet 3: J1.ETC")!
    expect(destination).toBeDefined()
    await act(async () => {
      destination.dispatchEvent(
        new dom.window.MouseEvent("click", { bubbles: true }),
      )
    })
    expect(selected).toEqual(["trace3"])
  } finally {
    await act(async () => reactRoot.unmount())
    await new Promise<void>((resolve) => dom.window.setTimeout(resolve, 0))
    restore()
  }
})
