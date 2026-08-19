import { expect, test } from "bun:test"
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
    MouseEvent: globalThis.MouseEvent,
    MutationObserver: globalThis.MutationObserver,
    Node: globalThis.Node,
    getComputedStyle: globalThis.getComputedStyle,
  }

  Object.assign(globalThis, {
    window: dom.window,
    document: dom.window.document,
    Element: dom.window.Element,
    Event: dom.window.Event,
    CustomEvent: dom.window.CustomEvent,
    HTMLElement: dom.window.HTMLElement,
    MouseEvent: dom.window.MouseEvent,
    MutationObserver: dom.window.MutationObserver,
    Node: dom.window.Node,
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
          showPorts={showPorts}
          onTogglePorts={setShowPorts}
          showGroups={false}
          onToggleGroups={() => {}}
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
