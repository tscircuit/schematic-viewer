import { useMemo } from "react"
import { su } from "@tscircuit/soup-util"
import type { CircuitJson } from "circuit-json"
import { zIndexMap } from "../utils/z-index-map"

interface ViewMenuProps {
  circuitJson: CircuitJson
  isVisible: boolean
  onClose: () => void
  selectedGroup?: string
  onGroupSelect: (groupId?: string) => void
}

export const ViewMenu = ({
  circuitJson,
  isVisible,
  onClose,
  selectedGroup,
  onGroupSelect,
}: ViewMenuProps) => {
  const schematicGroups = useMemo(() => {
    if (!circuitJson || circuitJson.length === 0) return []
    
    try {
      // Extract source groups from circuit JSON
      const sourceGroups = su(circuitJson).source_group?.list() || []
      
      // Get schematic components to understand the groups
      const schematicComponents = su(circuitJson).schematic_component?.list() || []
      
      // Group components by their source_group_id
      const groupMap = new Map<string, { 
        group: any, 
        components: any[] 
      }>()
      
      // Initialize groups
      for (const group of sourceGroups) {
        groupMap.set(group.source_group_id, {
          group,
          components: []
        })
      }
      
      // Add components to their respective groups
      for (const comp of schematicComponents) {
        const sourceComp = su(circuitJson).source_component.get(comp.source_component_id)
        if (sourceComp?.source_group_id) {
          const groupData = groupMap.get(sourceComp.source_group_id)
          if (groupData) {
            groupData.components.push(comp)
          }
        }
      }
      
      const explicitGroups = Array.from(groupMap.values()).filter(({ components }) => components.length > 0)
      
      // If no explicit groups, create virtual groups by component type
      if (explicitGroups.length === 0 && schematicComponents.length > 0) {
        const componentTypeGroups = new Map<string, any[]>()
        
        for (const comp of schematicComponents) {
          const sourceComp = su(circuitJson).source_component.get(comp.source_component_id)
          if (sourceComp) {
            const componentType = sourceComp.ftype || 'other'
            if (!componentTypeGroups.has(componentType)) {
              componentTypeGroups.set(componentType, [])
            }
            componentTypeGroups.get(componentType)!.push(comp)
          }
        }
        
        // Convert type groups to the same format as explicit groups
        return Array.from(componentTypeGroups.entries()).map(([type, components]) => ({
          group: {
            source_group_id: `type_${type}`,
            name: `${type.charAt(0).toUpperCase() + type.slice(1)} Components`,
            type: 'virtual_type_group'
          },
          components
        }))
      }
      
      return explicitGroups
    } catch (error) {
      console.error("Error extracting groups:", error)
      return []
    }
  }, [circuitJson])

  if (!isVisible) return null

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "transparent",
          zIndex: zIndexMap.viewMenuBackdrop,
        }}
      />
      
      {/* Menu */}
      <div
        style={{
          position: "absolute",
          top: "136px",
          right: "16px",
          backgroundColor: "#fff",
          border: "1px solid #ccc",
          borderRadius: "8px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          minWidth: "200px",
          maxHeight: "300px",
          overflowY: "auto",
          zIndex: zIndexMap.viewMenu,
        }}
      >
        <div
          style={{
            padding: "12px 16px",
            borderBottom: "1px solid #eee",
            fontWeight: "bold",
            fontSize: "14px",
            color: "#333",
          }}
        >
          View Options
        </div>
        
        {/* All Components Option */}
        <div
          onClick={() => {
            onGroupSelect(undefined)
            onClose()
          }}
          style={{
            padding: "8px 16px",
            cursor: "pointer",
            backgroundColor: !selectedGroup ? "#f0f8ff" : "transparent",
            borderLeft: !selectedGroup ? "3px solid #4CAF50" : "3px solid transparent",
            fontSize: "13px",
          }}
          onMouseEnter={(e) => {
            if (!selectedGroup) return
            e.currentTarget.style.backgroundColor = "#f5f5f5"
          }}
          onMouseLeave={(e) => {
            if (!selectedGroup) return
            e.currentTarget.style.backgroundColor = "transparent"
          }}
        >
          📋 All Components
        </div>
        
        {/* Groups */}
        {schematicGroups.length > 0 && (
          <>
            <div
              style={{
                padding: "8px 16px",
                fontSize: "12px",
                color: "#666",
                backgroundColor: "#f9f9f9",
                borderTop: "1px solid #eee",
              }}
            >
              Groups ({schematicGroups.length})
            </div>
            
            {schematicGroups.map(({ group, components }) => {
              const isVirtualGroup = group.type === 'virtual_type_group'
              const icon = isVirtualGroup ? 
                (group.source_group_id.includes('resistor') ? '🔴' :
                 group.source_group_id.includes('capacitor') ? '⚡' :
                 group.source_group_id.includes('chip') ? '🔲' :
                 group.source_group_id.includes('led') ? '💡' : '🔧') :
                '🏗️'
              
              return (
                <div
                  key={group.source_group_id}
                  onClick={() => {
                    onGroupSelect(group.source_group_id)
                    onClose()
                  }}
                  style={{
                    padding: "8px 16px",
                    cursor: "pointer",
                    backgroundColor: selectedGroup === group.source_group_id ? "#f0f8ff" : "transparent",
                    borderLeft: selectedGroup === group.source_group_id ? "3px solid #4CAF50" : "3px solid transparent",
                    fontSize: "13px",
                  }}
                  onMouseEnter={(e) => {
                    if (selectedGroup === group.source_group_id) return
                    e.currentTarget.style.backgroundColor = "#f5f5f5"
                  }}
                  onMouseLeave={(e) => {
                    if (selectedGroup === group.source_group_id) return
                    e.currentTarget.style.backgroundColor = "transparent"
                  }}
                >
                  <div style={{ fontWeight: "500" }}>
                    {icon} {group.name || `Group ${group.source_group_id.slice(-4)}`}
                    {isVirtualGroup && <span style={{ fontSize: "10px", color: "#999", marginLeft: "4px" }}>(by type)</span>}
                  </div>
                  <div style={{ fontSize: "11px", color: "#666", marginTop: "2px" }}>
                    {components.length} component{components.length !== 1 ? "s" : ""}
                  </div>
                </div>
              )
            })}
          </>
        )}
        
        {schematicGroups.length === 0 && (
          <div
            style={{
              padding: "16px",
              textAlign: "center",
              color: "#666",
              fontSize: "12px",
            }}
          >
            No groups found in this schematic
          </div>
        )}
      </div>
    </>
  )
}
