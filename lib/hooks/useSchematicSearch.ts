import type { SchematicViewerController } from "./useSchematicViewerController"
import type { CircuitJson } from "circuit-json"
import type { RefObject } from "react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { fromString, type Matrix } from "transformation-matrix"
import {
  getSchematicSearchResults,
  type SchematicSearchResult,
} from "../utils/get-schematic-search-results"
import { getSearchResultTransform } from "../utils/get-search-result-transform"

const MIN_SEARCH_RESULT_ZOOM = 1.8
const SEARCH_FOCUS_ANIMATION_MS = 350

export const useSchematicSearch = ({
  controller,
  circuitJson,
  circuitJsonKey,
  svgDivRef,
  containerRef,
  activeSheetId,
  hasMultipleSheets,
  handleSelectSheet,
  svgString,
  svgToScreenProjection,
  setSvgToScreenProjection,
  setIsInteractionEnabled,
}: {
  controller?: SchematicViewerController
  circuitJson: CircuitJson
  circuitJsonKey: string
  svgDivRef: RefObject<HTMLDivElement | null>
  containerRef: RefObject<HTMLElement | null>
  activeSheetId?: string
  hasMultipleSheets: boolean
  handleSelectSheet: (schematicSheetId: string) => void
  svgString: string
  svgToScreenProjection: Matrix
  setSvgToScreenProjection: (transform: Matrix) => void
  setIsInteractionEnabled: (enabled: boolean) => void
}) => {
  const [searchQuery, setSearchQuery] = useState("")
  const [pendingSearchResult, setPendingSearchResult] =
    useState<SchematicSearchResult | null>(null)
  const searchAnimationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  )

  const searchResults = useMemo(
    () => getSchematicSearchResults(circuitJson, searchQuery),
    [circuitJson, circuitJsonKey, searchQuery],
  )

  const focusSearchResult = useCallback(
    (result: SchematicSearchResult) => {
      const svgRoot = svgDivRef.current
      const container = containerRef.current
      if (!svgRoot || !container) return false

      let attribute = "data-schematic-net-label-id"
      if (result.target.type === "schematic_component") {
        attribute = "data-schematic-component-id"
      }
      const target = Array.from(
        svgRoot.querySelectorAll<SVGGraphicsElement>(`[${attribute}]`),
      ).find((element) => element.getAttribute(attribute) === result.target.id)
      if (!target) return false

      const targetRect = target.getBoundingClientRect()
      const containerRect = container.getBoundingClientRect()
      if (!containerRect.width || !containerRect.height) return false
      if (!targetRect.width && !targetRect.height) return false

      if (searchAnimationTimerRef.current) {
        clearTimeout(searchAnimationTimerRef.current)
      }

      let visibleProjection = svgToScreenProjection
      const visibleTransform = getComputedStyle(svgRoot).transform
      if (visibleTransform && visibleTransform !== "none") {
        try {
          visibleProjection = fromString(visibleTransform)
          svgRoot.style.transition = "none"
          svgRoot.style.transform = visibleTransform
          void svgRoot.offsetWidth
        } catch {
          // The transform tracked by the viewer is the safe fallback.
        }
      }

      svgRoot.style.transition = `transform ${SEARCH_FOCUS_ANIMATION_MS}ms ease-in-out`
      void svgRoot.offsetWidth
      setSvgToScreenProjection(
        getSearchResultTransform({
          containerRect,
          targetRect,
          visibleProjection,
          minimumScale: MIN_SEARCH_RESULT_ZOOM,
        }),
      )
      searchAnimationTimerRef.current = setTimeout(() => {
        svgRoot.style.transition = ""
      }, SEARCH_FOCUS_ANIMATION_MS)

      svgRoot
        .querySelectorAll(".schematic-search-match")
        .forEach((element) =>
          element.classList.remove("schematic-search-match"),
        )
      svgRoot.querySelectorAll(`[${attribute}]`).forEach((element) => {
        if (element.getAttribute(attribute) === result.target.id) {
          element.classList.add("schematic-search-match")
        }
      })
      return true
    },
    [containerRef, setSvgToScreenProjection, svgDivRef, svgToScreenProjection],
  )

  const handleSearchResultSelect = useCallback(
    (result: SchematicSearchResult) => {
      setIsInteractionEnabled(true)
      if (
        result.schematicSheetId &&
        result.schematicSheetId !== activeSheetId &&
        hasMultipleSheets
      ) {
        handleSelectSheet(result.schematicSheetId)
        setPendingSearchResult(result)
        return
      }
      focusSearchResult(result)
    },
    [
      activeSheetId,
      focusSearchResult,
      handleSelectSheet,
      hasMultipleSheets,
      setIsInteractionEnabled,
    ],
  )

  const handleCancelSearch = useCallback(() => {
    setSearchQuery("")
    setPendingSearchResult(null)
    if (searchAnimationTimerRef.current) {
      clearTimeout(searchAnimationTimerRef.current)
      searchAnimationTimerRef.current = null
    }
    if (svgDivRef.current) {
      svgDivRef.current.style.transition = ""
      svgDivRef.current
        .querySelectorAll(".schematic-search-match")
        .forEach((element) =>
          element.classList.remove("schematic-search-match"),
        )
    }
  }, [svgDivRef])

  const focusRequest = controller?.focusRequest
  const onFocusRequestHandled = controller?.onFocusRequestHandled
  useEffect(() => {
    if (!focusRequest) return
    const component = circuitJson.find(
      (element) =>
        element.type === "schematic_component" &&
        element.schematic_component_id === focusRequest.schematicComponentId,
    )
    if (component?.type !== "schematic_component") {
      setPendingSearchResult(null)
      onFocusRequestHandled?.(focusRequest)
      return
    }
    setIsInteractionEnabled(true)
    if (component.schematic_sheet_id && hasMultipleSheets) {
      handleSelectSheet(component.schematic_sheet_id)
    }
    // Keep the command queued until its sheet's SVG has mounted and been sized.
    setPendingSearchResult({
      kind: "component",
      label: component.schematic_component_id,
      schematicSheetId: component.schematic_sheet_id,
      target: {
        type: "schematic_component",
        id: component.schematic_component_id,
      },
    })
  }, [
    focusRequest,
    onFocusRequestHandled,
    circuitJson,
    circuitJsonKey,
    hasMultipleSheets,
    handleSelectSheet,
    setIsInteractionEnabled,
  ])

  useEffect(() => {
    if (!pendingSearchResult || !svgString) return
    if (
      hasMultipleSheets &&
      pendingSearchResult.schematicSheetId &&
      pendingSearchResult.schematicSheetId !== activeSheetId
    )
      return
    const frame = requestAnimationFrame(() => {
      if (focusSearchResult(pendingSearchResult)) {
        setPendingSearchResult(null)
        if (
          focusRequest?.schematicComponentId === pendingSearchResult.target.id
        ) {
          onFocusRequestHandled?.(focusRequest)
        }
      }
    })
    return () => cancelAnimationFrame(frame)
  }, [
    focusSearchResult,
    focusRequest,
    onFocusRequestHandled,
    pendingSearchResult,
    svgString,
    hasMultipleSheets,
    activeSheetId,
  ])

  useEffect(() => {
    if (searchQuery) return
    svgDivRef.current
      ?.querySelectorAll(".schematic-search-match")
      .forEach((element) => element.classList.remove("schematic-search-match"))
  }, [searchQuery, svgDivRef])

  useEffect(
    () => () => {
      if (searchAnimationTimerRef.current) {
        clearTimeout(searchAnimationTimerRef.current)
      }
    },
    [],
  )

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    handleSearchResultSelect,
    handleCancelSearch,
  }
}
