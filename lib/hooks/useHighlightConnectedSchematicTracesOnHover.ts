import { useEffect, type RefObject } from "react"
import { su } from "@tscircuit/soup-util"
import type { CircuitJson } from "circuit-json"

const HOVER_STYLE_ID = "schematic-trace-net-hover-style"
const HOVER_CLASS = "schematic-trace-net-hovered"

const getAttributeSelectorValue = (value: string) => CSS.escape(value)

class UnionFind {
  parent = new Map<string, string>()

  find(value: string): string {
    if (!this.parent.has(value)) {
      this.parent.set(value, value)
      return value
    }

    const parent = this.parent.get(value)!
    if (parent === value) return value

    const root = this.find(parent)
    this.parent.set(value, root)
    return root
  }

  union(a: string, b: string) {
    const rootA = this.find(a)
    const rootB = this.find(b)
    if (rootA !== rootB) {
      this.parent.set(rootB, rootA)
    }
  }
}

const getSourceTraceConnectionKeys = (sourceTrace: any) => {
  const keys: string[] = []

  for (const portId of sourceTrace.connected_source_port_ids ?? []) {
    keys.push(`source_port:${portId}`)
  }

  for (const netId of sourceTrace.connected_source_net_ids ?? []) {
    keys.push(`source_net:${netId}`)
  }

  if (sourceTrace.source_net_id) {
    keys.push(`source_net:${sourceTrace.source_net_id}`)
  }

  return keys
}

const addHoverStyle = (svgContainer: HTMLDivElement) => {
  if (svgContainer.querySelector(`#${HOVER_STYLE_ID}`)) return

  const style = document.createElement("style")
  style.id = HOVER_STYLE_ID
  style.textContent = `
    .${HOVER_CLASS} path:not(.trace-invisible-hover-outline):not(.invisible) {
      filter: invert(1);
    }

    .${HOVER_CLASS} .trace-crossing-outline {
      opacity: 0;
    }
  `
  svgContainer.appendChild(style)
}

const clearHoveredTraceGroups = (svgContainer: HTMLDivElement) => {
  for (const traceGroup of svgContainer.querySelectorAll(`.${HOVER_CLASS}`)) {
    traceGroup.classList.remove(HOVER_CLASS)
  }
}

/**
 * Highlights every schematic trace on the same source net as the hovered trace.
 */
export const useHighlightConnectedSchematicTracesOnHover = ({
  svgDivRef,
  circuitJson,
  circuitJsonKey,
}: {
  svgDivRef: RefObject<HTMLDivElement | null>
  circuitJson: CircuitJson
  circuitJsonKey: string
}) => {
  useEffect(() => {
    const svgContainer = svgDivRef.current
    if (!svgContainer) return

    addHoverStyle(svgContainer)

    const unionFind = new UnionFind()
    const sourceTraceGroupById = new Map<string, string>()

    for (const sourceTrace of su(circuitJson).source_trace.list() as any[]) {
      const sourceTraceId = sourceTrace.source_trace_id
      if (!sourceTraceId) continue

      unionFind.find(`source_trace:${sourceTraceId}`)

      for (const key of getSourceTraceConnectionKeys(sourceTrace)) {
        unionFind.union(`source_trace:${sourceTraceId}`, key)
      }
    }

    for (const sourceTrace of su(circuitJson).source_trace.list() as any[]) {
      const sourceTraceId = sourceTrace.source_trace_id
      if (!sourceTraceId) continue
      sourceTraceGroupById.set(
        sourceTraceId,
        unionFind.find(`source_trace:${sourceTraceId}`),
      )
    }

    for (const schematicTrace of su(
      circuitJson,
    ).schematic_trace.list() as any[]) {
      const schematicTraceId = schematicTrace.schematic_trace_id
      const sourceTraceId = schematicTrace.source_trace_id
      if (!schematicTraceId || !sourceTraceId) continue

      const group = sourceTraceGroupById.get(sourceTraceId)
      if (!group) continue

      for (const traceGroup of svgContainer.querySelectorAll(
        `[data-schematic-trace-id="${getAttributeSelectorValue(schematicTraceId)}"]`,
      )) {
        ;(traceGroup as HTMLElement).dataset.schematicNetGroup = group
      }
    }

    let hoveredGroup: string | null = null

    const handlePointerOver = (event: PointerEvent) => {
      const target = event.target as Element | null
      const traceGroup = target?.closest?.(
        '[data-circuit-json-type="schematic_trace"]',
      ) as HTMLElement | null
      const group = traceGroup?.dataset.schematicNetGroup

      if (!group || group === hoveredGroup) return

      clearHoveredTraceGroups(svgContainer)
      hoveredGroup = group

      for (const connectedTrace of svgContainer.querySelectorAll(
        `[data-schematic-net-group="${getAttributeSelectorValue(group)}"]`,
      )) {
        connectedTrace.classList.add(HOVER_CLASS)
      }
    }

    const handlePointerOut = (event: PointerEvent) => {
      const relatedTarget = event.relatedTarget as Element | null
      if (
        relatedTarget?.closest?.(
          `[data-schematic-net-group="${getAttributeSelectorValue(hoveredGroup ?? "")}"]`,
        )
      ) {
        return
      }

      hoveredGroup = null
      clearHoveredTraceGroups(svgContainer)
    }

    svgContainer.addEventListener("pointerover", handlePointerOver)
    svgContainer.addEventListener("pointerout", handlePointerOut)

    return () => {
      svgContainer.removeEventListener("pointerover", handlePointerOver)
      svgContainer.removeEventListener("pointerout", handlePointerOut)
      clearHoveredTraceGroups(svgContainer)
    }
  }, [svgDivRef, circuitJson, circuitJsonKey])
}
