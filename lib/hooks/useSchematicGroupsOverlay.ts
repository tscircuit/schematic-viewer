import { useEffect } from "react"
import { su } from "@tscircuit/soup-util"
import type { CircuitJson } from "circuit-json"

interface UseSchematicGroupsOverlayOptions {
  svgDivRef: React.RefObject<HTMLDivElement | null>
  circuitJson: CircuitJson
  circuitJsonKey: string
  showGroups: boolean
}

const GROUP_COLORS = [
  "#8B0000", // Dark Red
  "#2F4F4F", // Dark Slate Gray
  "#191970", // Midnight Blue
  "#006400", // Dark Green
  "#FF4500", // Dark Orange
  "#800080", // Purple
  "#2E8B57", // Sea Green
  "#B8860B", // Dark Goldenrod
  "#C71585", // Medium Violet Red
  "#008B8B", // Dark Cyan
]

export const useSchematicGroupsOverlay = (
  options: UseSchematicGroupsOverlayOptions,
) => {
  const { svgDivRef, circuitJson, circuitJsonKey, showGroups } = options

  useEffect(() => {
    // Always clean up existing overlays first
    if (svgDivRef.current) {
      const existingOverlays = svgDivRef.current.querySelectorAll(
        ".schematic-group-overlay",
      )
      existingOverlays.forEach((overlay) => overlay.remove())
    }

    if (
      !svgDivRef.current ||
      !showGroups ||
      !circuitJson ||
      circuitJson.length === 0
    ) {
      return
    }

    // Small delay to ensure SVG is rendered when groups are enabled from localStorage
    const timeoutId = setTimeout(() => {
      if (!svgDivRef.current) return

      const svg = svgDivRef.current.querySelector("svg")
      if (!svg) {
        return
      }

      const existingOverlays = svg.querySelectorAll(".schematic-group-overlay")
      existingOverlays.forEach((overlay) => overlay.remove())

      try {
        const sourceGroups =
          su(circuitJson)
            .source_group?.list()
            .filter((x) => !!!x.is_subcircuit) || []
        const schematicComponents =
          su(circuitJson).schematic_component?.list() || []

        const sourceGroupHierarchy = new Map<string, string[]>()
        sourceGroups.forEach((group) => {
          const groupWithParent = group as any
          if (groupWithParent.parent_source_group_id) {
            const children =
              sourceGroupHierarchy.get(
                groupWithParent.parent_source_group_id,
              ) || []
            children.push(group.source_group_id)
            sourceGroupHierarchy.set(
              groupWithParent.parent_source_group_id,
              children,
            )
          }
        })

        const getAllDescendantSourceGroups = (
          sourceGroupId: string,
        ): string[] => {
          const descendants: string[] = []
          const children = sourceGroupHierarchy.get(sourceGroupId) || []
          for (const child of children) {
            descendants.push(child)
            descendants.push(...getAllDescendantSourceGroups(child))
          }
          return descendants
        }

        const getGroupDepthLevel = (sourceGroupId: string): number => {
          const groupWithParent = sourceGroups.find(
            (g) => g.source_group_id === sourceGroupId,
          ) as any
          if (!groupWithParent?.parent_source_group_id) {
            return 0
          }
          return 1 + getGroupDepthLevel(groupWithParent.parent_source_group_id)
        }

        const hasMeaningfulGroups =
          sourceGroups.length > 0 &&
          sourceGroups.some((group) => group.name && group.name.trim() !== "")

        let groupsToRender: Array<{
          id: string
          name: string
          components: any[]
          color: string
          depthLevel: number
          hasChildren: boolean
          sourceGroupId?: string
        }> = []

        if (hasMeaningfulGroups) {
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

          sourceGroups.forEach((group, index) => {
            let groupComponents = groupMap.get(group.source_group_id) || []

            const descendantGroups = getAllDescendantSourceGroups(
              group.source_group_id,
            )
            for (const descendantGroupId of descendantGroups) {
              const descendantComponents = groupMap.get(descendantGroupId) || []
              groupComponents = [...groupComponents, ...descendantComponents]
            }

            if (groupComponents.length > 0) {
              const depthLevel = getGroupDepthLevel(group.source_group_id)
              const hasChildren =
                getAllDescendantSourceGroups(group.source_group_id).length > 0

              if (group.name?.startsWith("unnamed_board")) return
              groupsToRender.push({
                id: group.source_group_id,
                name: group.name || `Group ${index + 1}`,
                components: groupComponents,
                color: GROUP_COLORS[index % GROUP_COLORS.length],
                depthLevel,
                hasChildren,
                sourceGroupId: group.source_group_id,
              })
            }
          })
        }
        // else {
        //   const componentTypeGroups = new Map<string, any[]>()

        //   for (const comp of schematicComponents) {
        //     const sourceComp = su(circuitJson).source_component.get(comp.source_component_id)
        //     if (sourceComp) {
        //       const componentType = sourceComp.ftype || "other"
        //       if (!componentTypeGroups.has(componentType)) {
        //         componentTypeGroups.set(componentType, [])
        //       }
        //       componentTypeGroups.get(componentType)!.push(comp)
        //     }
        //   }
        //   // groupsToRender = Array.from(componentTypeGroups.entries()).map(
        //   //   ([type, components], index) => ({
        //   //     id: `type_${type}`,
        //   //     name: `${type.charAt(0).toUpperCase() + type.slice(1)}s`,
        //   //     components,
        //   //     color: GROUP_COLORS[index % GROUP_COLORS.length],
        //   //     depthLevel: 0,
        //   //     hasChildren: false,
        //   //   }),
        //   // )
        // }

        const viewBox = svg.viewBox.baseVal
        const svgRect = svg.getBoundingClientRect()
        const scale =
          Math.min(
            svgRect.width / viewBox.width,
            svgRect.height / viewBox.height,
          ) || 1

        groupsToRender.sort((a, b) => a.depthLevel - b.depthLevel)

        groupsToRender.forEach((group) => {
          if (group.components.length === 0) return

          const groupBounds = calculateGroupBounds(group.components, svg)
          if (!groupBounds) return

          const basePadding = Math.max(
            8,
            Math.min(25, 15 / Math.max(scale, 0.3)),
          )
          const hierarchyPadding = group.hasChildren ? basePadding * 0.6 : 0
          const totalPadding = basePadding + hierarchyPadding

          const baseStrokeWidth = Math.max(1, 2 / Math.max(scale, 0.5))
          const strokeWidth =
            group.depthLevel === 0 ? baseStrokeWidth : baseStrokeWidth * 0.7

          const baseDashSize = Math.max(4, 8 / Math.max(scale, 0.5))
          const dashMultiplier = group.hasChildren ? 1.3 : 1
          const dashSize = baseDashSize * dashMultiplier
          const gapSize = dashSize * 0.5

          const groupOverlay = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "rect",
          )
          groupOverlay.setAttribute("class", "schematic-group-overlay")
          groupOverlay.setAttribute(
            "x",
            (groupBounds.minX - totalPadding).toString(),
          )
          groupOverlay.setAttribute(
            "y",
            (groupBounds.minY - totalPadding).toString(),
          )
          groupOverlay.setAttribute(
            "width",
            (groupBounds.maxX - groupBounds.minX + totalPadding * 2).toString(),
          )
          groupOverlay.setAttribute(
            "height",
            (groupBounds.maxY - groupBounds.minY + totalPadding * 2).toString(),
          )
          groupOverlay.setAttribute("fill", "none")
          groupOverlay.setAttribute("stroke", group.color)
          groupOverlay.setAttribute("stroke-width", strokeWidth.toString())
          groupOverlay.setAttribute(
            "stroke-dasharray",
            `${dashSize},${gapSize}`,
          )
          groupOverlay.setAttribute("opacity", "0.8")
          groupOverlay.setAttribute("rx", "4")
          groupOverlay.setAttribute("ry", "4")

          const baseFontSize = Math.max(
            6,
            Math.min(20, 14 / Math.max(scale, 0.2)),
          )
          const fontSizeReduction =
            group.depthLevel === 0 || group.depthLevel === 1
              ? 0
              : group.depthLevel * 0.2
          const fontSize = baseFontSize * (1 - fontSizeReduction)

          const labelPadding = Math.max(1, fontSize * 0.2)
          const labelText = group.name

          const tempText = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "text",
          )
          tempText.setAttribute("font-size", fontSize.toString())
          tempText.setAttribute("font-family", "Arial, sans-serif")
          tempText.textContent = labelText
          svg.appendChild(tempText)
          const textBBox = tempText.getBBox()
          svg.removeChild(tempText)

          const labelWidth = textBBox.width + labelPadding * 2
          const labelHeight = fontSize + labelPadding * 2
          const labelX = groupBounds.minX - totalPadding
          const labelY = groupBounds.minY - totalPadding - labelHeight

          const labelBg = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "rect",
          )
          labelBg.setAttribute("class", "schematic-group-overlay")
          labelBg.setAttribute("x", labelX.toString())
          labelBg.setAttribute("y", (labelY - labelHeight).toString())
          labelBg.setAttribute("width", labelWidth.toString())
          labelBg.setAttribute("height", labelHeight.toString())
          labelBg.setAttribute("fill", "transparent")
          labelBg.setAttribute("rx", "3")
          labelBg.setAttribute("ry", "3")

          const groupLabel = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "text",
          )
          groupLabel.setAttribute("class", "schematic-group-overlay")
          groupLabel.setAttribute("x", (labelX + labelPadding).toString())
          groupLabel.setAttribute(
            "y",
            (labelY + labelHeight - labelPadding).toString(),
          )
          groupLabel.setAttribute("fill", group.color)
          groupLabel.setAttribute("font-size", fontSize.toString())
          groupLabel.setAttribute("font-family", "Arial, sans-serif")
          groupLabel.setAttribute(
            "font-weight",
            group.depthLevel === 0 ? "600" : "500",
          )
          groupLabel.setAttribute("stroke", group.color)
          groupLabel.setAttribute(
            "stroke-width",
            Math.max(0.2, fontSize * 0.02).toString(),
          )
          groupLabel.textContent = labelText

          svg.appendChild(groupOverlay)
          svg.appendChild(labelBg)
          svg.appendChild(groupLabel)
        })
      } catch (error) {
        console.error("Error creating group overlays:", error)
      }
    }, 10) // Small delay to ensure SVG is ready

    return () => clearTimeout(timeoutId)
  }, [svgDivRef, circuitJsonKey, showGroups])
}

function calculateGroupBounds(components: any[], svg: SVGElement) {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity

  for (const component of components) {
    let componentElement = svg.querySelector(
      `g[data-schematic-component-id="${component.schematic_component_id}"]`,
    )

    if (!componentElement) {
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
