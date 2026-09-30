import { su } from "@tscircuit/soup-util"
import type { CircuitJson } from "circuit-json"
export function buildNetRegistry(circuitJson: CircuitJson) {
  const cju = su(circuitJson)

  // source_component_id -> schematic_component_id
  const srcCompToSchComp = new Map<string, string>()
  for (const c of cju.schematic_component.list()) {
    if (c.source_component_id) {
      srcCompToSchComp.set(c.source_component_id, c.schematic_component_id)
    }
  }

  // schematic_component_id -> the connectivity nets its ports belong to (a chip
  // sits on several nets). The connectivity key lives on source_trace.
  const componentIdToKeys = new Map<string, Set<string>>()
  for (const sourceTrace of cju.source_trace.list()) {
    const key = sourceTrace.subcircuit_connectivity_map_key
    if (!key) continue
    for (const portId of sourceTrace.connected_source_port_ids ?? []) {
      const schCompId = srcCompToSchComp.get(
        cju.source_port.get(portId)?.source_component_id ?? "",
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
  for (const label of cju.schematic_net_label.list()) {
    if (!label.source_net_id) continue
    const key =
      cju.source_net.get(label.source_net_id)
        ?.subcircuit_connectivity_map_key ?? label.source_net_id
    netLabelIdToKey.set(label.schematic_net_label_id, key)
  }

  const textIdToKey = new Map<string, string>()
  for (const text of cju.schematic_text.list()) {
    if (!text.source_trace_id) continue
    const key = cju.source_trace.get(
      text.source_trace_id,
    )?.subcircuit_connectivity_map_key
    if (key) textIdToKey.set(text.schematic_text_id, key)
  }
  return { componentIdToKeys, netLabelIdToKey, textIdToKey }
}
