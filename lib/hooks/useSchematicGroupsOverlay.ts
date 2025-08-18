import { useEffect } from "react"
import { su } from "@tscircuit/soup-util"
import type { CircuitJson } from "circuit-json"

interface UseSchematicGroupsOverlayOptions {
  svgDivRef: React.RefObject<HTMLDivElement | null>
  circuitJson: CircuitJson
  circuitJsonKey: string
  showGroups: boolean
}

export const useSchematicGroupsOverlay = (
  options: UseSchematicGroupsOverlayOptions,
) => {
  const { svgDivRef, circuitJson, circuitJsonKey, showGroups } = options
  
  useEffect(() => {
    if (
      !svgDivRef.current ||
      !showGroups ||
      !circuitJson ||
      circuitJson.length === 0
    ) {
      // Remove any existing group overlays
      if (svgDivRef.current) {
        const existingOverlays = svgDivRef.current.querySelectorAll(
          ".schematic-group-overlay",
        )
        existingOverlays.forEach((overlay) => overlay.remove())
      }
      return
    }

    const svg = svgDivRef.current.querySelector("svg")
    if (!svg) {
      return
    }

    // Remove existing overlays first
    const existingOverlays = svg.querySelectorAll(".schematic-group-overlay")
    existingOverlays.forEach((overlay) => overlay.remove())

    try {
      // Get explicit groups first
      const sourceGroups = su(circuitJson).source_group?.list() || []
      const schematicComponents =
        su(circuitJson).schematic_component?.list() || []

      let groupsToRender: Array<{
        id: string
        name: string
        components: any[]
        color: string
      }> = []

      // Check if we have meaningful explicit groups (not just auto-generated default groups)
      const hasMeaningfulGroups = sourceGroups.length > 0 && 
        sourceGroups.some(group => group.name && group.name.trim() !== "")

      if (hasMeaningfulGroups) {
        // Use explicit groups
        const groupMap = new Map<string, any[]>()

        for (const comp of schematicComponents) {
          const sourceComp = su(circuitJson).source_component.get(
            comp.source_component_id,
          )
          if (sourceComp?.source_group_id) {
            if (!groupMap.has(sourceComp.source_group_id)) {
              groupMap.set(sourceComp.source_group_id, [])
            }
            groupMap.get(sourceComp.source_group_id)!.push(comp)
          }
        }

        groupsToRender = Array.from(groupMap.entries()).map(
          ([groupId, components], index) => {
            const group = sourceGroups.find(
              (g) => g.source_group_id === groupId,
            )
            return {
              id: groupId,
              name: group?.name || `Group ${index + 1}`,
              components,
              color: getGroupColor(index),
            }
          },
        )
      } else {
        // Create virtual groups by component type
        const componentTypeGroups = new Map<string, any[]>()

        for (const comp of schematicComponents) {
          const sourceComp = su(circuitJson).source_component.get(
            comp.source_component_id,
          )
          if (sourceComp) {
            const componentType = sourceComp.ftype || "other"
            if (!componentTypeGroups.has(componentType)) {
              componentTypeGroups.set(componentType, [])
            }
            componentTypeGroups.get(componentType)!.push(comp)
          }
        }

        groupsToRender = Array.from(componentTypeGroups.entries()).map(
          ([type, components], index) => ({
            id: `type_${type}`,
            name: `${type.charAt(0).toUpperCase() + type.slice(1)}s`,
            components,
            color: getGroupColor(index),
          }),
        )
      }

      // Render group overlays
      groupsToRender.forEach((group, groupIndex) => {
        if (group.components.length === 0) return

        // Calculate bounding box for the group
        const groupBounds = calculateGroupBounds(group.components, svg)
        if (!groupBounds) return

        // Create group overlay rectangle
        const groupOverlay = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "rect",
        )
        groupOverlay.setAttribute("class", "schematic-group-overlay")
        groupOverlay.setAttribute("x", (groupBounds.minX - 25).toString())
        groupOverlay.setAttribute("y", (groupBounds.minY - 25).toString())
        groupOverlay.setAttribute(
          "width",
          (groupBounds.maxX - groupBounds.minX + 50).toString(),
        )
        groupOverlay.setAttribute(
          "height",
          (groupBounds.maxY - groupBounds.minY + 50).toString(),
        )
        groupOverlay.setAttribute("fill", "none")
        groupOverlay.setAttribute("stroke", group.color)
        groupOverlay.setAttribute("stroke-width", "3")
        groupOverlay.setAttribute("stroke-dasharray", "8,4")
        groupOverlay.setAttribute("opacity", "0.8")
        groupOverlay.setAttribute("rx", "4")
        groupOverlay.setAttribute("ry", "4")

        // Create group label
        const groupLabel = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "text",
        )
        groupLabel.setAttribute("class", "schematic-group-overlay")
        groupLabel.setAttribute("x", (groupBounds.minX - 10).toString())
        groupLabel.setAttribute("y", (groupBounds.minY - 8).toString())
        groupLabel.setAttribute("fill", group.color)
        groupLabel.setAttribute("font-size", "14")
        groupLabel.setAttribute("font-family", "Arial, sans-serif")
        groupLabel.setAttribute("font-weight", "bold")
        groupLabel.setAttribute("stroke", "#fff")
        groupLabel.setAttribute("stroke-width", "0.5")
        groupLabel.setAttribute("paint-order", "stroke fill")
        groupLabel.textContent = group.name

        // Add overlays to the SVG (use appendChild to ensure they're on top)
        svg.appendChild(groupOverlay)
        svg.appendChild(groupLabel)
      })
    } catch (error) {
      console.error("Error creating group overlays:", error)
    }
  }, [svgDivRef, circuitJsonKey, showGroups])
}

function getGroupColor(index: number): string {
  const colors = [
    "#FF6B6B", // Red
    "#4ECDC4", // Teal
    "#45B7D1", // Blue
    "#96CEB4", // Green
    "#FF8C42", // Orange
    "#DDA0DD", // Plum
    "#98D8C8", // Mint
    "#F7DC6F", // Light Yellow
  ]
  return colors[index % colors.length]
}

function calculateGroupBounds(components: any[], svg: SVGElement) {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity

  for (const component of components) {
    // Look for the component group element (based on circuit-to-svg documentation)
    let componentElement = svg.querySelector(
      `g[data-schematic-component-id="${component.schematic_component_id}"]`,
    )
    
    if (!componentElement) {
      // Fallback to any element with the data attribute
      componentElement = svg.querySelector(
        `[data-schematic-component-id="${component.schematic_component_id}"]`,
      )
    }
    
    if (componentElement) {
      const bbox = (componentElement as SVGGraphicsElement).getBBox()
      minX = Math.min(minX, bbox.x)
      minY = Math.min(minY, bbox.y)
      maxX = Math.max(maxX, bbox.x + bbox.width)
      maxY = Math.max(maxY, bbox.y + bbox.height)
    }
  }

  if (minX === Infinity) {
    return null
  }

  const bounds = { minX, minY, maxX, maxY }
  return bounds
}
