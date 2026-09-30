import { buildNetRegistry } from "../utils/schematic-net-registry"
import type { CircuitJson } from "circuit-json"
import { useEffect } from "react"

const FADED_CLASS = "sch-net-faded"

const TRACE_SELECTOR =
  "g.trace[data-subcircuit-connectivity-map-key], g.trace-overlays[data-subcircuit-connectivity-map-key]"

const NET_LABEL_SELECTOR =
  "[data-schematic-net-label-id], [data-schematic-text-id]"

/**
 * Net highlighting on hover, done entirely in JS (the base SVG carries no
 * interaction). Hovering a wire or a net label fades every element that is NOT
 * part of that net — other nets' traces/labels and chips not connected to the
 * net — so the hovered net stands out by contrast rather than by recoloring.
 *
 * Identifies elements by the attributes circuit-to-svg emits:
 *  - traces:     g.trace[data-subcircuit-connectivity-map-key] (+ g.trace-overlays)
 *  - components: g[data-schematic-component-id]
 *  - net labels: [data-schematic-net-label-id] (per element, no wrapping group)
 *
 * Faded elements get the `sch-net-faded` class (styled by SchematicViewer).
 */
export const useSchematicNetHover = ({
  svgDivRef,
  circuitJson,
  circuitJsonKey,
  enabled,
}: {
  svgDivRef: React.RefObject<HTMLDivElement | null>
  circuitJson: CircuitJson
  circuitJsonKey: string
  enabled: boolean
}) => {
  useEffect(() => {
    const svgDiv = svgDivRef.current
    if (!enabled || !svgDiv) return

    const { componentIdToKeys, netLabelIdToKey, textIdToKey } =
      buildNetRegistry(circuitJson)

    // Every net element and the net key(s) it belongs to, plus each hover
    // trigger's net key. Rebuilt from the SVG whenever it re-renders; the
    // listeners below read them by closure.
    let netElements: Array<{ el: Element; keys: Set<string> }> = []
    const triggerNetKeys = new Map<Element, string>()
    let hoveredNetKey: string | null = null

    const collectNetElements = () => {
      for (const { el } of netElements) el.classList.remove(FADED_CLASS)
      netElements = []
      triggerNetKeys.clear()
      hoveredNetKey = null

      const svg = svgDiv.querySelector("svg")
      if (!svg) return

      for (const el of Array.from(svg.querySelectorAll(TRACE_SELECTOR))) {
        const key = el.getAttribute("data-subcircuit-connectivity-map-key")
        const keys = new Set<string>()
        if (key) {
          keys.add(key)
          triggerNetKeys.set(el, key)
        }
        netElements.push({ el, keys })
      }
      for (const el of Array.from(
        svg.querySelectorAll("g[data-schematic-component-id]"),
      )) {
        const id = el.getAttribute("data-schematic-component-id")!
        netElements.push({ el, keys: componentIdToKeys.get(id) ?? new Set() })
      }
      for (const el of Array.from(svg.querySelectorAll(NET_LABEL_SELECTOR))) {
        const key =
          netLabelIdToKey.get(
            el.getAttribute("data-schematic-net-label-id")!,
          ) ?? textIdToKey.get(el.getAttribute("data-schematic-text-id")!)
        const keys = new Set<string>()
        if (key) {
          keys.add(key)
          triggerNetKeys.set(el, key)
        }
        netElements.push({ el, keys })
      }
    }

    // Fade everything not on `key` (null clears the fade).
    const highlightNet = (key: string | null) => {
      if (key === hoveredNetKey) return
      hoveredNetKey = key
      for (const { el, keys } of netElements) {
        el.classList.toggle(FADED_CLASS, key !== null && !keys.has(key))
      }
    }

    const handleMouseMove = (e: MouseEvent) => {
      const target = e.target
      if (!(target instanceof Element)) {
        highlightNet(null)
        return
      }
      const trigger = target.closest(`${TRACE_SELECTOR}, ${NET_LABEL_SELECTOR}`)
      if (trigger && triggerNetKeys.has(trigger)) {
        highlightNet(triggerNetKeys.get(trigger)!)
        return
      }
      // Use screen pixels so the text hit margin stays usable at every zoom.
      for (const [el, key] of triggerNetKeys) {
        if (!el.matches(NET_LABEL_SELECTOR)) continue
        const rect = el.getBoundingClientRect()
        if (
          e.clientX >= rect.left - 6 &&
          e.clientX <= rect.right + 6 &&
          e.clientY >= rect.top - 6 &&
          e.clientY <= rect.bottom + 6
        ) {
          highlightNet(key)
          return
        }
      }
      highlightNet(null)
    }
    const handleMouseLeave = () => highlightNet(null)

    collectNetElements()
    svgDiv.addEventListener("mousemove", handleMouseMove)
    svgDiv.addEventListener("mouseleave", handleMouseLeave)

    // dangerouslySetInnerHTML replaces the <svg> node when the svg string
    // re-renders, so recollect against the fresh DOM. The listeners stay on the
    // stable svgDiv, so they don't need re-attaching.
    const observer = new MutationObserver(collectNetElements)
    observer.observe(svgDiv, { childList: true })

    return () => {
      observer.disconnect()
      svgDiv.removeEventListener("mousemove", handleMouseMove)
      svgDiv.removeEventListener("mouseleave", handleMouseLeave)
      for (const { el } of netElements) el.classList.remove(FADED_CLASS)
    }
    // Keyed on circuitJsonKey (content hash) rather than the circuitJson
    // reference, matching the other post-render SVG hooks.
  }, [svgDivRef, circuitJsonKey, enabled])
}
