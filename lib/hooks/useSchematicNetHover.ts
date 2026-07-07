import { su } from "@tscircuit/soup-util"
import type { CircuitJson } from "circuit-json"
import { useEffect } from "react"

const FADED_CLASS = "sch-net-faded"

const TRACE_SELECTOR =
  "g.trace[data-subcircuit-connectivity-map-key], g.trace-overlays[data-subcircuit-connectivity-map-key]"

const NET_LABEL_SELECTOR = "[data-schematic-net-label-id]"

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

    const { componentIdToKeys, netLabelIdToKey } = buildNetRegistry(circuitJson)

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
        const key = netLabelIdToKey.get(
          el.getAttribute("data-schematic-net-label-id")!,
        )
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

    const handleMouseOver = (e: Event) => {
      const target = e.target
      if (!(target instanceof Element)) {
        highlightNet(null)
        return
      }
      const trigger = target.closest(`${TRACE_SELECTOR}, ${NET_LABEL_SELECTOR}`)
      if (!trigger) {
        highlightNet(null)
        return
      }
      highlightNet(triggerNetKeys.get(trigger) ?? null)
    }
    const handleMouseLeave = () => highlightNet(null)

    collectNetElements()
    svgDiv.addEventListener("mouseover", handleMouseOver)
    svgDiv.addEventListener("mouseleave", handleMouseLeave)

    // dangerouslySetInnerHTML replaces the <svg> node when the svg string
    // re-renders, so recollect against the fresh DOM. The listeners stay on the
    // stable svgDiv, so they don't need re-attaching.
    const observer = new MutationObserver(collectNetElements)
    observer.observe(svgDiv, { childList: true })

    return () => {
      observer.disconnect()
      svgDiv.removeEventListener("mouseover", handleMouseOver)
      svgDiv.removeEventListener("mouseleave", handleMouseLeave)
      for (const { el } of netElements) el.classList.remove(FADED_CLASS)
    }
    // Keyed on circuitJsonKey (content hash) rather than the circuitJson
    // reference, matching the other post-render SVG hooks.
  }, [svgDivRef, circuitJsonKey, enabled])
}

/**
 * Derives, from the circuit JSON, the net membership needed to relate DOM
 * elements to nets:
 *  - componentIdToKeys: which connectivity nets each schematic component touches
 *  - netLabelIdToKey: a schematic_net_label_id -> its connectivity key
 */
function buildNetRegistry(circuitJson: CircuitJson) {
  const soup = su(circuitJson)

  // source_component_id -> schematic_component_id
  const srcCompToSchComp = new Map<string, string>()
  for (const c of soup.schematic_component.list()) {
    if (c.source_component_id) {
      srcCompToSchComp.set(c.source_component_id, c.schematic_component_id)
    }
  }

  // schematic_component_id -> the connectivity nets its ports belong to (a chip
  // sits on several nets). The connectivity key lives on source_trace.
  const componentIdToKeys = new Map<string, Set<string>>()
  for (const sourceTrace of soup.source_trace.list()) {
    const key = sourceTrace.subcircuit_connectivity_map_key
    if (!key) continue
    for (const portId of sourceTrace.connected_source_port_ids ?? []) {
      const schCompId = srcCompToSchComp.get(
        soup.source_port.get(portId)?.source_component_id ?? "",
      )
      if (!schCompId) continue
      if (!componentIdToKeys.has(schCompId)) {
        componentIdToKeys.set(schCompId, new Set())
      }
      componentIdToKeys.get(schCompId)!.add(key)
    }
  }

  // schematic_net_label_id -> connectivity key, resolved via its source_net
  // (same key the net's traces use). Falls back to source_net_id, which already
  // *is* the key for auto-emitted labels on unrouted nets (no source_net).
  const netLabelIdToKey = new Map<string, string>()
  for (const label of soup.schematic_net_label.list()) {
    if (!label.source_net_id) continue
    const key =
      soup.source_net.get(label.source_net_id)
        ?.subcircuit_connectivity_map_key ?? label.source_net_id
    netLabelIdToKey.set(label.schematic_net_label_id, key)
  }

  return { componentIdToKeys, netLabelIdToKey }
}
