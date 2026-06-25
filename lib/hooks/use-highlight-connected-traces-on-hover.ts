import type { CircuitJson } from "circuit-json"
import { useEffect } from "react"

const HOVER_KEY_ATTRIBUTE = "data-tscircuit-net-highlight-key"
const HOVER_STYLE_ID = "tscircuit-net-trace-hover-style"
const TRACE_HOVER_COLOR = "#ffb700"

const cssString = (value: string) =>
  value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')

export const getSchematicTraceHoverKeys = (circuitJson: CircuitJson) => {
  const sourceTraceIdsByConnectivityKey = new Map<string, Set<string>>()
  const sourceTraceParentById = new Map<string, string>()

  const findSourceTraceRoot = (sourceTraceId: string): string => {
    const parent = sourceTraceParentById.get(sourceTraceId)
    if (!parent) {
      sourceTraceParentById.set(sourceTraceId, sourceTraceId)
      return sourceTraceId
    }

    if (parent === sourceTraceId) return sourceTraceId

    const root = findSourceTraceRoot(parent)
    sourceTraceParentById.set(sourceTraceId, root)
    return root
  }

  const unionSourceTraces = (a: string, b: string) => {
    const aRoot = findSourceTraceRoot(a)
    const bRoot = findSourceTraceRoot(b)
    if (aRoot !== bRoot) sourceTraceParentById.set(bRoot, aRoot)
  }

  const addConnectivityKey = (
    sourceTraceId: string,
    connectivityKey: string | undefined,
  ) => {
    if (!connectivityKey) return

    const sourceTraceIds =
      sourceTraceIdsByConnectivityKey.get(connectivityKey) ?? new Set<string>()
    sourceTraceIds.add(sourceTraceId)
    sourceTraceIdsByConnectivityKey.set(connectivityKey, sourceTraceIds)
  }

  for (const element of circuitJson as any[]) {
    if (element.type !== "source_trace") continue

    const sourceTraceId = element.source_trace_id
    if (!sourceTraceId) continue

    findSourceTraceRoot(sourceTraceId)

    if (element.subcircuit_connectivity_map_key) {
      addConnectivityKey(
        sourceTraceId,
        `net:${element.subcircuit_connectivity_map_key}`,
      )
    }

    for (const connectedSourceNetId of element.connected_source_net_ids ?? []) {
      addConnectivityKey(sourceTraceId, `net:${connectedSourceNetId}`)
    }

    for (const connectedSourcePortId of element.connected_source_port_ids ??
      []) {
      addConnectivityKey(sourceTraceId, `port:${connectedSourcePortId}`)
    }
  }

  for (const sourceTraceIds of sourceTraceIdsByConnectivityKey.values()) {
    const [firstSourceTraceId, ...restSourceTraceIds] = sourceTraceIds
    for (const sourceTraceId of restSourceTraceIds) {
      unionSourceTraces(firstSourceTraceId, sourceTraceId)
    }
  }

  const schematicTraceHoverKeys = new Map<string, string>()
  for (const element of circuitJson as any[]) {
    if (element.type !== "schematic_trace") continue

    const schematicTraceId = element.schematic_trace_id
    if (!schematicTraceId) continue

    const sourceTraceId = element.source_trace_id
    schematicTraceHoverKeys.set(
      schematicTraceId,
      sourceTraceId
        ? `source_trace:${findSourceTraceRoot(sourceTraceId)}`
        : `schematic_trace:${schematicTraceId}`,
    )
  }

  return schematicTraceHoverKeys
}

const getHoverStyleText = (hoverKeys: Iterable<string>) => {
  const rules: string[] = []

  for (const hoverKey of new Set(hoverKeys)) {
    const keySelector = `[${HOVER_KEY_ATTRIBUTE}="${cssString(hoverKey)}"]`
    const traceSelector = `:is(g.trace${keySelector}, g.trace-overlays${keySelector})`
    const hoveredSelector = `${traceSelector}:hover`
    const visiblePathSelector = `${traceSelector} path:not(.invisible):not(.trace-crossing-outline)`

    rules.push(
      `svg:has(${hoveredSelector}) ${visiblePathSelector} { stroke: ${TRACE_HOVER_COLOR}; filter: drop-shadow(0 0 1px ${TRACE_HOVER_COLOR}); }`,
      `svg:has(${hoveredSelector}) g.trace-overlays${keySelector} .trace-crossing-outline { opacity: 0; }`,
    )
  }

  return rules.join("\n")
}

export const useHighlightConnectedTracesOnHover = ({
  svgDivRef,
  circuitJson,
}: {
  svgDivRef: React.RefObject<HTMLDivElement | null>
  circuitJson: CircuitJson
}) => {
  useEffect(() => {
    const svgDiv = svgDivRef.current
    if (!svgDiv) return

    const hoverKeys = getSchematicTraceHoverKeys(circuitJson)

    const applyHoverMetadata = () => {
      const traceGroups = svgDiv.querySelectorAll(
        '[data-circuit-json-type="schematic_trace"][data-schematic-trace-id]',
      )

      for (const traceGroup of Array.from(traceGroups)) {
        const schematicTraceId = traceGroup.getAttribute(
          "data-schematic-trace-id",
        )
        const hoverKey = schematicTraceId
          ? hoverKeys.get(schematicTraceId)
          : undefined

        if (hoverKey) {
          traceGroup.setAttribute(HOVER_KEY_ATTRIBUTE, hoverKey)
        } else {
          traceGroup.removeAttribute(HOVER_KEY_ATTRIBUTE)
        }
      }

      let style = svgDiv.querySelector<HTMLStyleElement>(`#${HOVER_STYLE_ID}`)
      if (!style) {
        style = document.createElement("style")
        style.id = HOVER_STYLE_ID
        svgDiv.appendChild(style)
      }
      style.textContent = getHoverStyleText(hoverKeys.values())
    }

    applyHoverMetadata()

    const observer = new MutationObserver(applyHoverMetadata)
    observer.observe(svgDiv, {
      childList: true,
      subtree: false,
    })

    return () => {
      observer.disconnect()
      svgDiv.querySelector(`#${HOVER_STYLE_ID}`)?.remove()
    }
  }, [svgDivRef, circuitJson])
}
