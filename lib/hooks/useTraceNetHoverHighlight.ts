import type { CircuitJson } from "circuit-json"
import { useEffect, useMemo, useRef } from "react"

const TRACE_HOVER_STROKE = "#ffb700"
const TRACE_HOVER_STROKE_WIDTH_MULTIPLIER = 1.35

type CircuitJsonElement = CircuitJson[number] & Record<string, any>

type TraceHoverIndex = {
  schematicTraceIdToGroupKey: Map<string, string>
  groupKeyToSchematicTraceIds: Map<string, Set<string>>
}

const getCircuitJsonHash = (circuitJson: CircuitJson) =>
  `${circuitJson?.length || 0}_${(circuitJson as any)?.editCount || 0}`

const getKnownNetId = (element: CircuitJsonElement | undefined) => {
  if (!element) return null

  return (
    element.source_net_id ??
    element.subcircuit_connectivity_map_key ??
    element.global_connectivity_map_key ??
    element.global_conn_net_id ??
    element.net_id ??
    element.pcb_net_id ??
    null
  )
}

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

const buildTraceHoverIndex = (circuitJson: CircuitJson): TraceHoverIndex => {
  const schematicTraceIdToSourceTraceId = new Map<string, string>()
  const sourceTraceIds = new Set<string>()
  const sourceTraceById = new Map<string, CircuitJsonElement>()
  const sourcePortById = new Map<string, CircuitJsonElement>()
  const sourceNetById = new Map<string, CircuitJsonElement>()
  const sourceTraceIdsByNetId = new Map<string, Set<string>>()
  const sourceTraceIdsBySourcePortId = new Map<string, Set<string>>()
  const unionFind = new UnionFind()

  for (const element of circuitJson as CircuitJsonElement[]) {
    if (element?.type === "source_trace" && element.source_trace_id) {
      const sourceTraceId = element.source_trace_id as string
      sourceTraceIds.add(sourceTraceId)
      sourceTraceById.set(sourceTraceId, element)
      unionFind.find(sourceTraceId)
    }

    if (element?.type === "source_port" && element.source_port_id) {
      sourcePortById.set(element.source_port_id as string, element)
    }

    if (element?.type === "source_net" && element.source_net_id) {
      sourceNetById.set(element.source_net_id as string, element)
    }
  }

  for (const element of circuitJson as CircuitJsonElement[]) {
    if (element?.type !== "schematic_trace") continue
    if (!element.schematic_trace_id || !element.source_trace_id) continue

    const schematicTraceId = element.schematic_trace_id as string
    const sourceTraceId = element.source_trace_id as string
    schematicTraceIdToSourceTraceId.set(schematicTraceId, sourceTraceId)
    sourceTraceIds.add(sourceTraceId)
    unionFind.find(sourceTraceId)
  }

  for (const sourceTraceId of sourceTraceIds) {
    const sourceTrace = sourceTraceById.get(sourceTraceId)
    const traceNetId = getKnownNetId(sourceTrace)
    if (traceNetId)
      addToMapSet(sourceTraceIdsByNetId, String(traceNetId), sourceTraceId)

    for (const sourcePortId of sourceTrace?.connected_source_port_ids ?? []) {
      const sourcePortIdString = String(sourcePortId)
      addToMapSet(
        sourceTraceIdsBySourcePortId,
        sourcePortIdString,
        sourceTraceId,
      )

      const sourcePort = sourcePortById.get(sourcePortIdString)
      const portNetId = getKnownNetId(sourcePort)
      if (portNetId)
        addToMapSet(sourceTraceIdsByNetId, String(portNetId), sourceTraceId)
    }

    for (const sourceNetId of sourceTrace?.connected_source_net_ids ?? []) {
      addToMapSet(sourceTraceIdsByNetId, String(sourceNetId), sourceTraceId)
    }
  }

  for (const [netId, net] of sourceNetById) {
    for (const sourceTraceId of net.connected_source_trace_ids ?? []) {
      addToMapSet(sourceTraceIdsByNetId, netId, String(sourceTraceId))
    }
    for (const sourcePortId of net.connected_source_port_ids ?? []) {
      const traceIds = sourceTraceIdsBySourcePortId.get(String(sourcePortId))
      if (!traceIds) continue
      for (const sourceTraceId of traceIds) {
        addToMapSet(sourceTraceIdsByNetId, netId, sourceTraceId)
      }
    }
  }

  for (const connectedTraceIds of [
    ...sourceTraceIdsByNetId.values(),
    ...sourceTraceIdsBySourcePortId.values(),
  ]) {
    const [firstTraceId, ...restTraceIds] = Array.from(connectedTraceIds)
    if (!firstTraceId) continue
    for (const traceId of restTraceIds) {
      unionFind.union(firstTraceId, traceId)
    }
  }

  const schematicTraceIdToGroupKey = new Map<string, string>()
  const groupKeyToSchematicTraceIds = new Map<string, Set<string>>()

  for (const [
    schematicTraceId,
    sourceTraceId,
  ] of schematicTraceIdToSourceTraceId) {
    const groupKey = unionFind.find(sourceTraceId)
    schematicTraceIdToGroupKey.set(schematicTraceId, groupKey)
    addToMapSet(groupKeyToSchematicTraceIds, groupKey, schematicTraceId)
  }

  return { schematicTraceIdToGroupKey, groupKeyToSchematicTraceIds }
}

const isVisibleTracePath = (path: SVGPathElement) => {
  const className = path.getAttribute("class") ?? ""
  return (
    !className.includes("invisible") &&
    !className.includes("trace-crossing-outline")
  )
}

/**
 * Highlights every visible schematic trace segment that belongs to the same
 * electrical net as the hovered trace segment.
 */
export const useTraceNetHoverHighlight = ({
  svgDivRef,
  circuitJson,
}: {
  svgDivRef: React.RefObject<HTMLDivElement | null>
  circuitJson: CircuitJson
}) => {
  const originalPathStylesRef = useRef<
    WeakMap<
      SVGPathElement,
      { stroke: string | null; strokeWidth: string | null }
    >
  >(new WeakMap())
  const activeGroupKeyRef = useRef<string | null>(null)
  const circuitJsonHash = useMemo(
    () => getCircuitJsonHash(circuitJson),
    [circuitJson],
  )
  const traceHoverIndex = useMemo(
    () => buildTraceHoverIndex(circuitJson),
    [circuitJsonHash, circuitJson],
  )

  useEffect(() => {
    const svg = svgDivRef.current
    if (!svg) return

    const getTraceContainer = (target: EventTarget | null) => {
      if (!(target instanceof Element)) return null
      return target.closest<SVGElement>("[data-schematic-trace-id]")
    }

    const getGroupKeyForTarget = (target: EventTarget | null) => {
      const traceContainer = getTraceContainer(target)
      const schematicTraceId = traceContainer?.getAttribute(
        "data-schematic-trace-id",
      )
      if (!schematicTraceId) return null
      return (
        traceHoverIndex.schematicTraceIdToGroupKey.get(schematicTraceId) ?? null
      )
    }

    const forEachPathInTraceGroup = (
      groupKey: string,
      callback: (path: SVGPathElement) => void,
    ) => {
      const schematicTraceIds =
        traceHoverIndex.groupKeyToSchematicTraceIds.get(groupKey)
      if (!schematicTraceIds) return

      for (const traceElement of Array.from(
        svg.querySelectorAll<SVGElement>("[data-schematic-trace-id]"),
      )) {
        const schematicTraceId = traceElement.getAttribute(
          "data-schematic-trace-id",
        )
        if (!schematicTraceId || !schematicTraceIds.has(schematicTraceId))
          continue

        for (const path of Array.from(
          traceElement.querySelectorAll<SVGPathElement>("path"),
        )) {
          if (!isVisibleTracePath(path)) continue
          callback(path)
        }
      }
    }

    const clearHighlight = () => {
      const groupKey = activeGroupKeyRef.current
      if (!groupKey) return

      forEachPathInTraceGroup(groupKey, (path) => {
        const originalStyle = originalPathStylesRef.current.get(path)
        if (!originalStyle) return

        if (originalStyle.stroke === null) {
          path.removeAttribute("stroke")
        } else {
          path.setAttribute("stroke", originalStyle.stroke)
        }

        if (originalStyle.strokeWidth === null) {
          path.removeAttribute("stroke-width")
        } else {
          path.setAttribute("stroke-width", originalStyle.strokeWidth)
        }
      })

      activeGroupKeyRef.current = null
    }

    const applyHighlight = (groupKey: string) => {
      if (activeGroupKeyRef.current === groupKey) return
      clearHighlight()
      activeGroupKeyRef.current = groupKey

      forEachPathInTraceGroup(groupKey, (path) => {
        if (!originalPathStylesRef.current.has(path)) {
          originalPathStylesRef.current.set(path, {
            stroke: path.getAttribute("stroke"),
            strokeWidth: path.getAttribute("stroke-width"),
          })
        }

        const strokeWidth = path.getAttribute("stroke-width")
        const strokeWidthNumber = strokeWidth
          ? Number.parseFloat(strokeWidth)
          : null

        path.setAttribute("stroke", TRACE_HOVER_STROKE)
        if (
          strokeWidth &&
          strokeWidthNumber &&
          Number.isFinite(strokeWidthNumber)
        ) {
          path.setAttribute(
            "stroke-width",
            strokeWidth.replace(
              String(strokeWidthNumber),
              String(strokeWidthNumber * TRACE_HOVER_STROKE_WIDTH_MULTIPLIER),
            ),
          )
        }
      })
    }

    const handleMouseOver = (event: MouseEvent) => {
      const groupKey = getGroupKeyForTarget(event.target)
      if (groupKey) applyHighlight(groupKey)
    }

    const handleMouseOut = (event: MouseEvent) => {
      const groupKey = getGroupKeyForTarget(event.target)
      if (!groupKey) return

      const nextGroupKey = getGroupKeyForTarget(event.relatedTarget)
      if (nextGroupKey === groupKey) return

      clearHighlight()
    }

    svg.addEventListener("mouseover", handleMouseOver)
    svg.addEventListener("mouseout", handleMouseOut)

    return () => {
      svg.removeEventListener("mouseover", handleMouseOver)
      svg.removeEventListener("mouseout", handleMouseOut)
      clearHighlight()
    }
  }, [svgDivRef, traceHoverIndex])
}
