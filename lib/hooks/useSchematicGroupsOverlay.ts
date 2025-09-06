import { useEffect, useRef, useCallback } from "react"
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
  const redrawTimeoutRef = useRef<number | Timer>(0)
  const overlayGroupRef = useRef<SVGGElement | null>(null)
  const groupDataRef = useRef<any[]>([])
  const isInitializedRef = useRef(false)

  const getOrCreateOverlayGroup = useCallback(() => {
    const svg = svgDivRef.current?.querySelector("svg")
    if (!svg) return null

    if (!overlayGroupRef.current || !svg.contains(overlayGroupRef.current)) {
      const existingGroup = svg.querySelector(
        ".schematic-groups-overlay-container",
      )
      if (existingGroup) {
        existingGroup.remove()
      }

      overlayGroupRef.current = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "g",
      )
      overlayGroupRef.current.setAttribute(
        "class",
        "schematic-groups-overlay-container",
      )
      overlayGroupRef.current.style.pointerEvents = "none"
      svg.appendChild(overlayGroupRef.current)
    }

    return overlayGroupRef.current
  }, [svgDivRef])

  const updateGroupOverlays = useCallback(() => {
    if (redrawTimeoutRef.current) {
      clearTimeout(redrawTimeoutRef.current)
    }

    if (
      !svgDivRef.current ||
      !showGroups ||
      !circuitJson ||
      circuitJson.length === 0
    ) {
      const overlayGroup = getOrCreateOverlayGroup()
      if (overlayGroup) {
        overlayGroup.style.display = "none"
      }
      return
    }

    const svg = svgDivRef.current.querySelector("svg")
    if (!svg) {
      return
    }

    const overlayGroup = getOrCreateOverlayGroup()
    if (!overlayGroup) {
      return
    }

    overlayGroup.style.display = "block"

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
            sourceGroupHierarchy.get(groupWithParent.parent_source_group_id) ||
            []
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
      const viewBox = svg.viewBox.baseVal
      const svgRect = svg.getBoundingClientRect()
      const scale =
        Math.min(
          svgRect.width / viewBox.width,
          svgRect.height / viewBox.height,
        ) || 1

      groupDataRef.current = groupsToRender
      groupsToRender.sort((a, b) => a.depthLevel - b.depthLevel)

      overlayGroup.innerHTML = ""

      groupsToRender.forEach((group, index) => {
        if (group.components.length === 0) return

        const groupBounds = calculateGroupBounds(group.components, svg)
        if (!groupBounds) return

        const basePadding = Math.max(8, Math.min(25, 15 / Math.max(scale, 0.3)))
        const hierarchyPadding = group.hasChildren ? basePadding * 0.6 : 0
        const totalPadding = basePadding + hierarchyPadding

        const baseStrokeWidth = Math.max(1, 2 / Math.max(scale, 0.5))
        const strokeWidth =
          group.depthLevel === 0 ? baseStrokeWidth : baseStrokeWidth * 0.7

        const baseDashSize = Math.max(4, 8 / Math.max(scale, 0.5))
        const dashMultiplier = group.hasChildren ? 1.3 : 1
        const dashSize = baseDashSize * dashMultiplier
        const gapSize = dashSize * 0.5

        const groupContainer = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "g",
        )
        groupContainer.setAttribute("class", "schematic-group-overlay")
        groupContainer.setAttribute("data-group-id", group.id)

        const groupOverlay = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "rect",
        )
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
        groupOverlay.setAttribute("stroke-dasharray", `${dashSize},${gapSize}`)
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

        groupContainer.appendChild(groupOverlay)
        groupContainer.appendChild(labelBg)
        groupContainer.appendChild(groupLabel)
        overlayGroup.appendChild(groupContainer)
      })
    } catch (error) {
      console.error("Error creating group overlays:", error)
    }
  }, [
    svgDivRef,
    circuitJson,
    circuitJsonKey,
    showGroups,
    getOrCreateOverlayGroup,
  ])

  useEffect(() => {
    if (showGroups && !isInitializedRef.current) {
      updateGroupOverlays()
      isInitializedRef.current = true
    } else if (!showGroups) {
      isInitializedRef.current = false
      const overlayGroup = getOrCreateOverlayGroup()
      if (overlayGroup) {
        overlayGroup.style.display = "none"
      }
    }
  }, [showGroups, updateGroupOverlays, getOrCreateOverlayGroup])

  useEffect(() => {
    if (showGroups) {
      updateGroupOverlays()
    }
  }, [circuitJsonKey, updateGroupOverlays, showGroups])

  useEffect(() => {
    if (!svgDivRef.current || !showGroups) return

    const observer = new MutationObserver((mutations) => {
      let svgRecreated = false

      mutations.forEach((mutation) => {
        if (mutation.type === "childList") {
          const addedSvg = Array.from(mutation.addedNodes).some(
            (node) => node instanceof Element && node.tagName === "svg",
          )
          const removedOverlayContainer = Array.from(
            mutation.removedNodes,
          ).some(
            (node) =>
              node instanceof Element &&
              node.classList?.contains("schematic-groups-overlay-container"),
          )

          if (addedSvg || removedOverlayContainer) {
            svgRecreated = true
          }
        }
      })

      if (svgRecreated) {
        overlayGroupRef.current = null
        if (redrawTimeoutRef.current) {
          clearTimeout(redrawTimeoutRef.current)
        }
        redrawTimeoutRef.current = setTimeout(() => {
          updateGroupOverlays()
        }, 50)
      }
    })

    observer.observe(svgDivRef.current, {
      childList: true,
      subtree: false,
    })

    return () => {
      observer.disconnect()
      if (redrawTimeoutRef.current) {
        clearTimeout(redrawTimeoutRef.current)
      }
    }
  }, [svgDivRef, showGroups, updateGroupOverlays])
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
