import type { CircuitJson } from "circuit-json"
import { useEffect, useMemo } from "react"
import { su } from "@tscircuit/soup-util"

const HOVERED_TRACE_CLASS = "schematic-trace-hovered"

type CircuitJsonElement = CircuitJson[number] & Record<string, any>

class UnionFind {
  parent = new Map<string, string>()

  find(id: string): string {
    const parent = this.parent.get(id)
    if (!parent) {
      this.parent.set(id, id)
      return id
    }
    if (parent === id) return id

    const root = this.find(parent)
    this.parent.set(id, root)
    return root
  }

  union(a: string, b: string) {
    const rootA = this.find(a)
    const rootB = this.find(b)
    if (rootA !== rootB) this.parent.set(rootB, rootA)
  }
}

const addToMapSet = (
  map: Map<string, Set<string>>,
  key: string,
  value: string,
) => {
  const values = map.get(key) ?? new Set<string>()
  values.add(value)
  map.set(key, values)
}

const getKnownNetKeys = (element: CircuitJsonElement | undefined) => {
  if (!element) return []

  return [
    element.subcircuit_connectivity_map_key,
    element.global_connectivity_map_key,
    element.global_conn_net_id,
    element.net_id,
    element.pcb_net_id,
  ]
    .filter(Boolean)
    .map((value) => `known-net:${String(value)}`)
}

export const getSchematicTraceIdsByConnectionKey = (
  circuitJson: CircuitJson,
) => {
  const idsByConnectionKey = new Map<string, Set<string>>()

  try {
    const unionFind = new UnionFind()
    const sourceTraceIdsByNetId = new Map<string, Set<string>>()
    const sourceTraceIdsByPortId = new Map<string, Set<string>>()
    const sourceTraceIdBySchematicTraceId = new Map<string, string>()
    const sourceTraces = su(circuitJson).source_trace.list()

    for (const sourceTrace of sourceTraces) {
      if (!sourceTrace.source_trace_id) continue

      const sourceTraceId = sourceTrace.source_trace_id
      unionFind.find(sourceTraceId)

      for (const sourceNetId of sourceTrace.connected_source_net_ids ?? []) {
        addToMapSet(sourceTraceIdsByNetId, String(sourceNetId), sourceTraceId)
      }

      for (const knownNetKey of getKnownNetKeys(sourceTrace)) {
        addToMapSet(sourceTraceIdsByNetId, knownNetKey, sourceTraceId)
      }

      for (const sourcePortId of sourceTrace.connected_source_port_ids ?? []) {
        addToMapSet(sourceTraceIdsByPortId, String(sourcePortId), sourceTraceId)
      }
    }

    for (const schematicTrace of su(circuitJson).schematic_trace.list()) {
      if (
        !schematicTrace.schematic_trace_id ||
        !schematicTrace.source_trace_id
      ) {
        continue
      }

      sourceTraceIdBySchematicTraceId.set(
        schematicTrace.schematic_trace_id,
        schematicTrace.source_trace_id,
      )
      unionFind.find(schematicTrace.source_trace_id)
    }

    for (const element of circuitJson as CircuitJsonElement[]) {
      if (element?.type !== "source_net" || !element.source_net_id) continue

      const sourceNetId = String(element.source_net_id)
      const sourceNetKeys = [sourceNetId, ...getKnownNetKeys(element)]

      for (const sourceTraceId of element.connected_source_trace_ids ?? []) {
        for (const sourceNetKey of sourceNetKeys) {
          addToMapSet(
            sourceTraceIdsByNetId,
            sourceNetKey,
            String(sourceTraceId),
          )
        }
      }

      for (const sourcePortId of element.connected_source_port_ids ?? []) {
        const sourceTraceIds = sourceTraceIdsByPortId.get(String(sourcePortId))
        if (!sourceTraceIds) continue

        for (const sourceTraceId of sourceTraceIds) {
          for (const sourceNetKey of sourceNetKeys) {
            addToMapSet(sourceTraceIdsByNetId, sourceNetKey, sourceTraceId)
          }
        }
      }
    }

    for (const connectedTraceIds of [
      ...sourceTraceIdsByNetId.values(),
      ...sourceTraceIdsByPortId.values(),
    ]) {
      const [firstTraceId, ...restTraceIds] = Array.from(connectedTraceIds)
      if (!firstTraceId) continue

      for (const sourceTraceId of restTraceIds) {
        unionFind.union(firstTraceId, sourceTraceId)
      }
    }

    for (const [
      schematicTraceId,
      sourceTraceId,
    ] of sourceTraceIdBySchematicTraceId) {
      const connectionKey = `source-trace-group:${unionFind.find(
        sourceTraceId,
      )}`
      const traceIds = idsByConnectionKey.get(connectionKey) ?? new Set()
      traceIds.add(schematicTraceId)
      idsByConnectionKey.set(connectionKey, traceIds)
    }
  } catch (err) {
    console.error("Failed to derive connected schematic trace ids", err)
  }

  return idsByConnectionKey
}

export const useHighlightConnectedSchematicTraces = ({
  svgDivRef,
  circuitJson,
  circuitJsonKey,
}: {
  svgDivRef: React.RefObject<HTMLDivElement | null>
  circuitJson: CircuitJson
  circuitJsonKey: string
}) => {
  const schematicTraceIdsByConnectionKey = useMemo(() => {
    return getSchematicTraceIdsByConnectionKey(circuitJson)
  }, [circuitJsonKey, circuitJson])

  const connectionKeyBySchematicTraceId = useMemo(() => {
    const connectionKeyByTraceId = new Map<string, string>()

    for (const [
      connectionKey,
      schematicTraceIds,
    ] of schematicTraceIdsByConnectionKey.entries()) {
      for (const schematicTraceId of schematicTraceIds) {
        connectionKeyByTraceId.set(schematicTraceId, connectionKey)
      }
    }

    return connectionKeyByTraceId
  }, [schematicTraceIdsByConnectionKey])

  useEffect(() => {
    const svgDiv = svgDivRef.current
    if (!svgDiv) return

    const clearHoveredTraces = () => {
      for (const trace of Array.from(
        svgDiv.querySelectorAll(`.${HOVERED_TRACE_CLASS}`),
      )) {
        trace.classList.remove(HOVERED_TRACE_CLASS)
      }
    }

    const setHoveredTraceGroup = (schematicTraceId: string | null) => {
      clearHoveredTraces()
      if (!schematicTraceId) return

      const connectionKey =
        connectionKeyBySchematicTraceId.get(schematicTraceId)
      if (!connectionKey) return

      const schematicTraceIds =
        schematicTraceIdsByConnectionKey.get(connectionKey) ?? new Set()

      for (const connectedSchematicTraceId of schematicTraceIds) {
        const connectedTrace = svgDiv.querySelector(
          `[data-schematic-trace-id="${connectedSchematicTraceId}"]`,
        )
        connectedTrace?.classList.add(HOVERED_TRACE_CLASS)
      }
    }

    const getTraceIdFromEvent = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Element)) return null

      const traceElement = target.closest("[data-schematic-trace-id]")
      return traceElement?.getAttribute("data-schematic-trace-id") ?? null
    }

    const handleMouseOver = (event: MouseEvent) => {
      setHoveredTraceGroup(getTraceIdFromEvent(event))
    }

    const handleMouseOut = (event: MouseEvent) => {
      const relatedTarget = event.relatedTarget
      if (relatedTarget instanceof Element) {
        const nextTraceId =
          relatedTarget
            .closest("[data-schematic-trace-id]")
            ?.getAttribute("data-schematic-trace-id") ?? null

        if (nextTraceId) {
          setHoveredTraceGroup(nextTraceId)
          return
        }
      }

      clearHoveredTraces()
    }

    const mutationObserver = new MutationObserver(() => {
      clearHoveredTraces()
    })

    svgDiv.addEventListener("mouseover", handleMouseOver)
    svgDiv.addEventListener("mouseout", handleMouseOut)
    mutationObserver.observe(svgDiv, { childList: true, subtree: true })

    return () => {
      svgDiv.removeEventListener("mouseover", handleMouseOver)
      svgDiv.removeEventListener("mouseout", handleMouseOut)
      mutationObserver.disconnect()
      clearHoveredTraces()
    }
  }, [
    svgDivRef,
    connectionKeyBySchematicTraceId,
    schematicTraceIdsByConnectionKey,
  ])
}
