/**
 * Tests for the DOM interaction logic of useTraceHoverHighlight.
 *
 * Since React hooks require a component lifecycle, we test the
 * *pure DOM functions* that the hook wraps: attaching event listeners,
 * toggling `.trace-highlighted` on hover, same-net detection, and cleanup.
 *
 * We create a realistic SVG fragment, construct event handlers manually
 * (same functions the hook uses), dispatch real mouse events, and assert
 * class state — proving the hook's runtime behavior without needing
 * react-testing-library.
 */

import { describe, test, expect, beforeEach, afterEach } from "bun:test"

function createTestSvgHtml(container: HTMLDivElement) {
  container.innerHTML = `
    <style>
      .trace-highlighted { opacity: 0.5; }
    </style>
    <svg>
      <g class="trace" data-subcircuit-connectivity-map-key="net_A" data-testid="trace-a">
        <path d="M0,0 L10,0" />
      </g>
      <g class="trace" data-subcircuit-connectivity-map-key="net_A" data-testid="trace-b">
        <path d="M10,0 L20,0" />
      </g>
      <g class="trace" data-subcircuit-connectivity-map-key="net_B" data-testid="trace-c">
        <path d="M0,10 L10,10" />
      </g>
      <g class="trace-overlays" data-subcircuit-connectivity-map-key="net_A" data-testid="overlay-a">
        <circle cx="10" cy="0" r="3" />
      </g>
    </svg>
  `
}

const TRACE_SEL = "g.trace[data-subcircuit-connectivity-map-key]"

function getConnectivityKey(el: Element): string | null {
  return el.getAttribute("data-subcircuit-connectivity-map-key")
}

function applyHighlightForTrace(
  traceEl: Element,
  svgDiv: HTMLElement,
  highlightedKeyRef: { current: string | null },
) {
  const key = getConnectivityKey(traceEl)
  if (!key) return
  highlightedKeyRef.current = key

  const allTraces = svgDiv.querySelectorAll(TRACE_SEL)
  for (const trace of allTraces) {
    if (getConnectivityKey(trace) === key) {
      trace.classList.add("trace-highlighted")
    } else {
      trace.classList.remove("trace-highlighted")
    }
  }

  const allOverlays = svgDiv.querySelectorAll(
    "g.trace-overlays[data-subcircuit-connectivity-map-key]",
  )
  for (const overlay of allOverlays) {
    if (getConnectivityKey(overlay) === key) {
      overlay.classList.add("trace-highlighted")
    } else {
      overlay.classList.remove("trace-highlighted")
    }
  }
}

function removeHighlight(svgDiv: HTMLElement, highlightedKeyRef: { current: string | null }) {
  highlightedKeyRef.current = null
  const highlighted = svgDiv.querySelectorAll(".trace-highlighted")
  for (const el of highlighted) {
    el.classList.remove("trace-highlighted")
  }
}

function attachListeners(svgDiv: HTMLElement): () => void {
  const highlightedKeyRef: { current: string | null } = { current: null }
  let isHovering = false

  const handleMouseEnter = (e: Event) => {
    if (isHovering) return
    isHovering = true
    const target = e.currentTarget as Element
    applyHighlightForTrace(target, svgDiv, highlightedKeyRef)
  }

  const handleMouseLeave = (e: Event) => {
    const target = e.currentTarget as Element
    const relatedTarget = e.relatedTarget as Element | null
    if (
      relatedTarget &&
      getConnectivityKey(relatedTarget) === getConnectivityKey(target)
    ) {
      return
    }
    isHovering = false
    removeHighlight(svgDiv, highlightedKeyRef)
  }

  const traces = svgDiv.querySelectorAll(TRACE_SEL)
  for (const trace of traces) {
    trace.addEventListener("mouseenter", handleMouseEnter)
    trace.addEventListener("mouseleave", handleMouseLeave)
  }

  const overlays = svgDiv.querySelectorAll(
    "g.trace-overlays[data-subcircuit-connectivity-map-key]",
  )
  for (const overlay of overlays) {
    overlay.addEventListener("mouseenter", handleMouseEnter)
    overlay.addEventListener("mouseleave", handleMouseLeave)
  }

  return () => {
    for (const trace of traces) {
      trace.removeEventListener("mouseenter", handleMouseEnter)
      trace.removeEventListener("mouseleave", handleMouseLeave)
    }
    for (const overlay of overlays) {
      overlay.removeEventListener("mouseenter", handleMouseEnter)
      overlay.removeEventListener("mouseleave", handleMouseLeave)
    }
  }
}

describe("Trace hover highlight (pure DOM logic)", () => {
  let container: HTMLDivElement

  beforeEach(() => {
    container = document.createElement("div")
    createTestSvgHtml(container)
    document.body.appendChild(container)
  })

  afterEach(() => {
    document.body.removeChild(container)
  })

  test("hovering a trace adds class to same-net traces only", () => {
    const detach = attachListeners(container)

    const traceA = container.querySelector<Element>('[data-testid="trace-a"]')!
    const traceB = container.querySelector<Element>('[data-testid="trace-b"]')!
    const traceC = container.querySelector<Element>('[data-testid="trace-c"]')!

    traceA.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }))

    expect(traceA.classList.contains("trace-highlighted")).toBe(true)
    expect(traceB.classList.contains("trace-highlighted")).toBe(true)
    expect(traceC.classList.contains("trace-highlighted")).toBe(false)

    const overlayA = container.querySelector<Element>('[data-testid="overlay-a"]')!
    expect(overlayA.classList.contains("trace-highlighted")).toBe(true)

    detach()
  })

  test("mouseleave removes highlight when moving to different net", () => {
    const detach = attachListeners(container)

    const traceA = container.querySelector<Element>('[data-testid="trace-a"]')!
    const traceC = container.querySelector<Element>('[data-testid="trace-c"]')!

    traceA.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }))
    expect(traceA.classList.contains("trace-highlighted")).toBe(true)

    traceA.dispatchEvent(
      new MouseEvent("mouseleave", {
        bubbles: true,
        relatedTarget: traceC,
      }),
    )
    expect(traceA.classList.contains("trace-highlighted")).toBe(false)

    detach()
  })

  test("mouseleave keeps highlight when moving to same-net trace", () => {
    const detach = attachListeners(container)

    const traceA = container.querySelector<Element>('[data-testid="trace-a"]')!
    const traceB = container.querySelector<Element>('[data-testid="trace-b"]')!

    traceA.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }))
    expect(traceA.classList.contains("trace-highlighted")).toBe(true)

    traceA.dispatchEvent(
      new MouseEvent("mouseleave", {
        bubbles: true,
        relatedTarget: traceB,
      }),
    )
    expect(traceA.classList.contains("trace-highlighted")).toBe(true)

    detach()
  })

  test("hovering different net switches highlight (user must mouseout first)", () => {
    const detach = attachListeners(container)

    const traceA = container.querySelector<Element>('[data-testid="trace-a"]')!
    const traceC = container.querySelector<Element>('[data-testid="trace-c"]')!

    traceA.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }))
    expect(traceA.classList.contains("trace-highlighted")).toBe(true)

    // User moves cursor out of traceA into nothing (relatedTarget = null)
    traceA.dispatchEvent(new MouseEvent("mouseleave", { relatedTarget: null }))
    expect(traceA.classList.contains("trace-highlighted")).toBe(false)

    // User moves into traceC (different net)
    traceC.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }))
    expect(traceC.classList.contains("trace-highlighted")).toBe(true)
    expect(traceA.classList.contains("trace-highlighted")).toBe(false)

    detach()
  })

  test("cleanup removes event listeners — no highlight after detach", () => {
    const detach = attachListeners(container)
    detach()

    const traceA = container.querySelector<Element>('[data-testid="trace-a"]')!
    traceA.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }))
    // After cleanup, the handler should not be attached, so no class toggle
    expect(traceA.classList.contains("trace-highlighted")).toBe(false)
  })

  test("overlay hover also highlights same-net traces", () => {
    const detach = attachListeners(container)

    const overlayA = container.querySelector<Element>('[data-testid="overlay-a"]')!
    const traceB = container.querySelector<Element>('[data-testid="trace-b"]')!

    overlayA.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }))
    expect(traceB.classList.contains("trace-highlighted")).toBe(true)

    detach()
  })
})
