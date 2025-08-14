import { useMemo } from "react"
import { su } from "@tscircuit/soup-util"
import type { CircuitJson } from "circuit-json"

export const useFilteredCircuitJson = (
  circuitJson: CircuitJson,
  selectedGroupId?: string
): CircuitJson => {
  return useMemo(() => {
    if (!selectedGroupId || !circuitJson || circuitJson.length === 0) {
      return circuitJson
    }

    try {
      let componentsInGroup: any[] = []
      
      // Handle virtual type groups (created by component type)
      if (selectedGroupId.startsWith('type_')) {
        const componentType = selectedGroupId.replace('type_', '')
        const sourceComponents = su(circuitJson).source_component.list()
        componentsInGroup = sourceComponents.filter(comp => comp.ftype === componentType)
      } else {
        // Handle explicit groups
        const sourceComponents = su(circuitJson).source_component.list()
        componentsInGroup = sourceComponents.filter(
          comp => comp.source_group_id === selectedGroupId
        )
      }
      
      const componentIds = new Set(componentsInGroup.map(comp => comp.source_component_id))

      // Get schematic components for the selected group
      const schematicComponents = su(circuitJson).schematic_component.list()
        .filter(comp => componentIds.has(comp.source_component_id))
      const schematicComponentIds = new Set(
        schematicComponents.map(comp => comp.schematic_component_id)
      )

      // Get ports for the selected components
      const sourcePorts = su(circuitJson).source_port.list()
        .filter(port => componentIds.has(port.source_component_id))
      const sourcePortIds = new Set(sourcePorts.map(port => port.source_port_id))

      const schematicPorts = su(circuitJson).schematic_port?.list()
        ?.filter(port => sourcePortIds.has(port.source_port_id)) || []

      // Get traces that connect to the selected components
      const sourceTraces = su(circuitJson).source_trace?.list()
        ?.filter(trace => 
          trace.connected_source_port_ids?.some(portId => sourcePortIds.has(portId))
        ) || []
      const sourceTraceIds = new Set(sourceTraces.map(trace => trace.source_trace_id))

      const schematicTraces = su(circuitJson).schematic_trace?.list()
        ?.filter(trace => sourceTraceIds.has(trace.source_trace_id)) || []

      // Create filtered circuit JSON
      const filteredJson: CircuitJson = [
        ...componentsInGroup,
        ...sourcePorts,
        ...sourceTraces,
        ...schematicComponents,
        ...schematicPorts,
        ...schematicTraces,
        // Include the selected group itself (if it's not a virtual group)
        ...(!selectedGroupId.startsWith('type_') ? 
          su(circuitJson).source_group.list().filter(group => group.source_group_id === selectedGroupId) :
          []
        ),
        // Include any other metadata that might be needed
        ...circuitJson.filter((item: any) => 
          item.type === "schematic_box" ||
          item.type === "schematic_text" ||
          (item.type === "schematic_component" && !item.source_component_id) // Keep components without source (like labels)
        )
      ]

      return filteredJson
    } catch (error) {
      console.error("Error filtering circuit JSON:", error)
      return circuitJson
    }
  }, [circuitJson, selectedGroupId])
}
