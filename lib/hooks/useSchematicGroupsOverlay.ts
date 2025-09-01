import { useEffect, useMemo, useRef, useCallback } from "react"
import { su } from "@tscircuit/soup-util"
import type { CircuitJson } from "circuit-json"

// Throttle function for performance
const throttle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number,
): T => {
  let timeoutId: NodeJS.Timeout | null = null
  let lastExecTime = 0

  return ((...args: Parameters<T>) => {
    const currentTime = Date.now()

    if (currentTime - lastExecTime > delay) {
      func(...args)
      lastExecTime = currentTime
    } else {
      if (timeoutId) clearTimeout(timeoutId)
      timeoutId = setTimeout(
        () => {
          func(...args)
          lastExecTime = Date.now()
        },
        delay - (currentTime - lastExecTime),
      )
    }
  }) as T
}

interface UseSchematicGroupsOverlayOptions {
  svgDivRef: React.RefObject<HTMLDivElement | null>
  circuitJson: CircuitJson
  circuitJsonKey: string
  showGroups: boolean
}

const GROUP_COLORS = [
  "#8B0000",
  "#2F4F4F",
  "#191970",
  "#006400",
  "#FF4500",
  "#800080",
  "#2E8B57",
  "#B8860B",
  "#C71585",
  "#008B8B",
]

interface GroupData {
  id: string
  name: string
  components: any[]
  color: string
  depthLevel: number
  hasChildren: boolean
  sourceGroupId?: string
}

export const useSchematicGroupsOverlay = (
  options: UseSchematicGroupsOverlayOptions,
) => {
  const { svgDivRef, circuitJson, circuitJsonKey, showGroups } = options
  const overlayElementsRef = useRef<SVGElement[]>([])
  const lastProcessedKeyRef = useRef<string>("")

  // Memoize group data processing
  const groupsData = useMemo(() => {
    if (!circuitJson || circuitJson.length === 0) return null

    try {
      const sourceGroups =
        su(circuitJson)
          .source_group?.list()
          ?.filter((x) => !x.is_subcircuit) || []
      const schematicComponents =
        su(circuitJson).schematic_component?.list() || []

      if (sourceGroups.length === 0) return null

      // Build hierarchy map once
      const hierarchyMap = new Map<string, string[]>()
      const depthCache = new Map<string, number>()

      sourceGroups.forEach((group) => {
        const groupWithParent = group as any
        if (groupWithParent.parent_source_group_id) {
          const children =
            hierarchyMap.get(groupWithParent.parent_source_group_id) || []
          children.push(group.source_group_id)
          hierarchyMap.set(groupWithParent.parent_source_group_id, children)
        }
      })

      // Optimized depth calculation with memoization
      const getDepth = (sourceGroupId: string): number => {
        if (depthCache.has(sourceGroupId)) return depthCache.get(sourceGroupId)!

        const group = sourceGroups.find(
          (g) => g.source_group_id === sourceGroupId,
        ) as any
        const depth = group?.parent_source_group_id
          ? 1 + getDepth(group.parent_source_group_id)
          : 0
        depthCache.set(sourceGroupId, depth)
        return depth
      }

      // Build component map once
      const componentMap = new Map<string, any[]>()
      schematicComponents.forEach((comp) => {
        const sourceComp = su(circuitJson).source_component.get(
          comp.source_component_id,
        )
        if (sourceComp?.source_group_id) {
          const existing = componentMap.get(sourceComp.source_group_id) || []
          existing.push(comp)
          componentMap.set(sourceComp.source_group_id, existing)
        }
      })

      // Process groups efficiently
      const groups: GroupData[] = []
      sourceGroups.forEach((group, index) => {
        if (group.name?.startsWith("unnamed_board")) return

        const groupComponents = componentMap.get(group.source_group_id) || []
        if (groupComponents.length === 0) return

        const depthLevel = getDepth(group.source_group_id)
        const hasChildren = hierarchyMap.has(group.source_group_id)

        groups.push({
          id: group.source_group_id,
          name: group.name || `Group ${index + 1}`,
          components: groupComponents,
          color: GROUP_COLORS[index % GROUP_COLORS.length],
          depthLevel,
          hasChildren,
          sourceGroupId: group.source_group_id,
        })
      })

      return groups.sort((a, b) => a.depthLevel - b.depthLevel)
    } catch (error) {
      console.error("Error processing group data:", error)
      return null
    }
  }, [circuitJsonKey])

  // Optimized cleanup function
  const clearOverlays = useCallback(() => {
    overlayElementsRef.current.forEach((element) => element.remove())
    overlayElementsRef.current = []
  }, [])

  // Throttled render function to prevent excessive re-renders
  const throttledRender = useRef<(() => void) | null>(null)

  // Optimized bounds calculation with element caching
  const elementCacheRef = useRef<Map<string, SVGGraphicsElement>>(new Map())

  const calculateBounds = useCallback((components: any[], svg: SVGElement) => {
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity
    let foundAny = false
    const cache = elementCacheRef.current

    for (const component of components) {
      const componentId = component.schematic_component_id
      let element = cache.get(componentId)

      if (!element) {
        element = svg.querySelector(
          `[data-schematic-component-id="${componentId}"]`,
        ) as SVGGraphicsElement
        if (element) cache.set(componentId, element)
      }

      if (element) {
        const bbox = element.getBBox()
        minX = Math.min(minX, bbox.x)
        minY = Math.min(minY, bbox.y)
        maxX = Math.max(maxX, bbox.x + bbox.width)
        maxY = Math.max(maxY, bbox.y + bbox.height)
        foundAny = true
      }
    }

    return foundAny ? { minX, minY, maxX, maxY } : null
  }, [])

  // Main effect with optimizations
  useEffect(() => {
    const currentKey = `${circuitJsonKey}_${showGroups}`

    // Skip if already processed
    if (currentKey === lastProcessedKeyRef.current) return
    lastProcessedKeyRef.current = currentKey

    clearOverlays()

    if (!svgDivRef.current || !showGroups || !groupsData) return

    const svg = svgDivRef.current.querySelector("svg")
    if (!svg) return

    // Clear element cache when circuit changes
    elementCacheRef.current.clear()

    // Use requestAnimationFrame for smooth rendering with timeout fallback
    let timeoutId: NodeJS.Timeout
    const renderFrame = () => {
      try {
        const viewBox = svg.viewBox.baseVal
        const svgRect = svg.getBoundingClientRect()
        const scale =
          Math.min(
            svgRect.width / viewBox.width,
            svgRect.height / viewBox.height,
          ) || 1

        // Pre-calculate common values
        const scaleClamp = Math.max(scale, 0.3)
        const strokeScaleClamp = Math.max(scale, 0.5)

        // Create document fragment for batch DOM operations
        const fragment = document.createDocumentFragment()
        const newElements: SVGElement[] = []

        // Process groups in batches to avoid blocking
        const processGroup = (group: GroupData) => {
          const bounds = calculateBounds(group.components, svg)
          if (!bounds) return

          const basePadding = Math.max(8, Math.min(25, 15 / scaleClamp))
          const totalPadding =
            basePadding + (group.hasChildren ? basePadding * 0.6 : 0)
          const strokeWidth =
            group.depthLevel === 0
              ? Math.max(1, 2 / strokeScaleClamp)
              : Math.max(1, 2 / strokeScaleClamp) * 0.7

          // Create elements with minimal DOM operations
          const rect = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "rect",
          )
          const text = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "text",
          )

          // Set attributes in batch
          const rectAttrs = [
            ["class", "schematic-group-overlay"],
            ["x", (bounds.minX - totalPadding).toString()],
            ["y", (bounds.minY - totalPadding).toString()],
            [
              "width",
              (bounds.maxX - bounds.minX + totalPadding * 2).toString(),
            ],
            [
              "height",
              (bounds.maxY - bounds.minY + totalPadding * 2).toString(),
            ],
            ["fill", "none"],
            ["stroke", group.color],
            ["stroke-width", strokeWidth.toString()],
            ["stroke-dasharray", "8,4"],
            ["opacity", "0.8"],
            ["rx", "4"],
          ]

          rectAttrs.forEach(([name, value]) => rect.setAttribute(name, value))

          const fontSize = Math.max(6, Math.min(20, 14 / Math.max(scale, 0.2)))
          const textAttrs = [
            ["class", "schematic-group-overlay"],
            ["x", (bounds.minX - totalPadding + 4).toString()],
            ["y", (bounds.minY - totalPadding - 4).toString()],
            ["fill", group.color],
            ["font-size", fontSize.toString()],
            ["font-family", "Arial, sans-serif"],
            ["font-weight", group.depthLevel === 0 ? "600" : "500"],
          ]

          textAttrs.forEach(([name, value]) => text.setAttribute(name, value))
          text.textContent = group.name

          newElements.push(rect, text)
          fragment.appendChild(rect)
          fragment.appendChild(text)
        }

        // Process all groups
        groupsData.forEach(processGroup)

        // Single DOM append operation
        svg.appendChild(fragment)
        overlayElementsRef.current = newElements
      } catch (error) {
        console.error("Error creating group overlays:", error)
      }
    }

    // Create throttled render function if not exists
    if (!throttledRender.current) {
      throttledRender.current = throttle(renderFrame, 16) // Throttle to ~60fps
    }

    // Use throttled render for better performance
    const frameId = requestAnimationFrame(throttledRender.current)
    timeoutId = setTimeout(throttledRender.current, 16) // Fallback after 16ms

    return () => {
      cancelAnimationFrame(frameId)
      clearTimeout(timeoutId)
    }
  }, [circuitJsonKey, showGroups, groupsData, clearOverlays, calculateBounds])

  // Cleanup on unmount
  useEffect(() => {
    return clearOverlays
  }, [clearOverlays])
}
