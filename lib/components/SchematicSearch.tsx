import { CornerDownLeft, Cpu, GitBranch, Search, X } from "lucide-react"
import { useEffect, useRef, useState, type RefObject } from "react"
import type { SchematicSearchResult } from "../utils/get-schematic-search-results"
import { zIndexMap } from "../utils/z-index-map"

const HighlightedSearchText = ({
  text,
  query,
}: {
  text: string
  query: string
}) => {
  const normalizedQuery = query.trim().toLocaleLowerCase()
  if (!normalizedQuery) return text

  const normalizedText = text.toLocaleLowerCase()
  const parts: React.ReactNode[] = []
  let cursor = 0
  let matchIndex = normalizedText.indexOf(normalizedQuery)

  while (matchIndex !== -1) {
    if (matchIndex > cursor) {
      parts.push(text.slice(cursor, matchIndex))
    }
    parts.push(
      <strong key={`${matchIndex}-${cursor}`} style={{ fontWeight: 700 }}>
        {text.slice(matchIndex, matchIndex + normalizedQuery.length)}
      </strong>,
    )
    cursor = matchIndex + normalizedQuery.length
    matchIndex = normalizedText.indexOf(normalizedQuery, cursor)
  }

  if (cursor < text.length) parts.push(text.slice(cursor))
  if (parts.length > 0) return parts
  return text
}

const getShortcutLabel = () => {
  if (typeof navigator === "undefined") return "Ctrl F"
  if (/mac/i.test(navigator.platform)) return "⌘ F"
  return "Ctrl F"
}

export const SchematicSearch = ({
  query,
  onQueryChange,
  onCancel,
  results,
  onSelect,
  viewerContainerRef,
}: {
  query: string
  onQueryChange: (query: string) => void
  onCancel: () => void
  results: SchematicSearchResult[]
  onSelect: (result: SchematicSearchResult) => void
  viewerContainerRef: RefObject<HTMLElement | null>
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [activeResultId, setActiveResultId] = useState<string | null>(null)
  const [hoveredResultId, setHoveredResultId] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsListRef = useRef<HTMLDivElement>(null)
  const shortcutLabel = getShortcutLabel()

  useEffect(() => {
    setActiveResultId((currentId) => {
      if (results.some((result) => result.target.id === currentId)) {
        return currentId
      }
      return (
        results.find((result) => result.kind === "component")?.target.id ??
        results[0]?.target.id ??
        null
      )
    })
  }, [results])

  useEffect(() => {
    if (!activeResultId) return
    resultsListRef.current
      ?.querySelector(`[data-search-result-id="${activeResultId}"]`)
      ?.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }, [activeResultId])

  useEffect(() => {
    const handleFindShortcut = (event: KeyboardEvent) => {
      if (event.code !== "KeyF" && event.key.toLocaleLowerCase() !== "f") {
        return
      }
      if (!event.metaKey && !event.ctrlKey) {
        return
      }
      if (!viewerContainerRef.current?.matches(":hover")) return

      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()
      setIsOpen(true)
      requestAnimationFrame(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
      })
    }

    const shortcutWindows: Window[] = [window]
    try {
      if (window.parent !== window && window.parent.document) {
        shortcutWindows.push(window.parent)
      }
    } catch {
      // Cross-origin parents cannot be accessed; the local listener still works.
    }

    shortcutWindows.forEach((targetWindow) =>
      targetWindow.addEventListener("keydown", handleFindShortcut, {
        capture: true,
      }),
    )
    return () => {
      shortcutWindows.forEach((targetWindow) =>
        targetWindow.removeEventListener("keydown", handleFindShortcut, {
          capture: true,
        }),
      )
    }
  }, [viewerContainerRef])

  const cancelSearch = () => {
    onCancel()
    setIsOpen(false)
    inputRef.current?.blur()
  }

  const componentResults = results.filter(
    (result) => result.kind === "component",
  )
  const netResults = results.filter((result) => result.kind === "net")
  const orderedResults = [...componentResults, ...netResults]
  const activeResult =
    orderedResults.find((result) => result.target.id === activeResultId) ??
    orderedResults[0]
  const resultCountLabel =
    results.length === 1 ? "1 result" : `${results.length} results`
  let searchHeaderBorder = "none"
  if (query) searchHeaderBorder = "1px solid #e8e8e8"

  const handleSearchKeyDown = (event: React.KeyboardEvent) => {
    if (
      event.key === "Enter" &&
      event.target instanceof Element &&
      event.target.closest('[aria-label="Clear search"]')
    ) {
      return
    }
    if (event.key === "Escape") {
      event.preventDefault()
      cancelSearch()
      return
    }
    if (
      orderedResults.length > 0 &&
      (event.key === "ArrowDown" || event.key === "ArrowUp")
    ) {
      event.preventDefault()
      let direction = -1
      if (event.key === "ArrowDown") direction = 1
      setActiveResultId((currentId) => {
        const currentIndex = orderedResults.findIndex(
          (result) => result.target.id === currentId,
        )
        let startIndex = currentIndex
        if (currentIndex === -1) {
          startIndex = 0
          if (direction === 1) startIndex = -1
        }
        const nextIndex =
          (startIndex + direction + orderedResults.length) %
          orderedResults.length
        return orderedResults[nextIndex]?.target.id ?? null
      })
      return
    }
    if (event.key === "Enter" && activeResult) {
      event.preventDefault()
      onSelect(activeResult)
    }
  }

  const renderResultSection = (
    title: string,
    sectionResults: SchematicSearchResult[],
  ) => {
    if (sectionResults.length === 0) return null
    return (
      <section>
        <div
          style={{
            padding: "6px 12px 3px",
            backgroundColor: "#f7f7f8",
            color: "#777777",
            fontSize: "11px",
            fontWeight: 600,
            letterSpacing: "0.02em",
            textTransform: "lowercase",
          }}
        >
          {title}
        </div>
        {sectionResults.map((result) => {
          const active = result.target.id === activeResult?.target.id
          const hovering = result.target.id === hoveredResultId
          let resultBackground = "#ffffff"
          if (hovering || active) resultBackground = "#f1f3f5"

          let resultIcon = (
            <GitBranch size={15} strokeWidth={1.8} aria-hidden="true" />
          )
          if (result.kind === "component") {
            resultIcon = <Cpu size={15} strokeWidth={1.8} aria-hidden="true" />
          }
          return (
            <button
              type="button"
              key={result.target.id}
              data-search-result-id={result.target.id}
              onClick={() => {
                setActiveResultId(result.target.id)
                onSelect(result)
              }}
              onMouseEnter={() => setHoveredResultId(result.target.id)}
              onMouseLeave={() => setHoveredResultId(null)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: "9px",
                padding: "7px 12px",
                border: "none",
                background: resultBackground,
                color: "#222222",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <span
                style={{
                  width: "26px",
                  height: "26px",
                  flexShrink: 0,
                  display: "grid",
                  placeItems: "center",
                  border: "1px solid #e5e5e5",
                  borderRadius: "6px",
                  backgroundColor: "#f7f7f7",
                  color: "#666666",
                }}
              >
                {resultIcon}
              </span>
              <span style={{ minWidth: 0, flex: 1 }}>
                <span
                  style={{
                    display: "block",
                    overflow: "hidden",
                    fontSize: "13px",
                    fontWeight: 400,
                    lineHeight: 1.25,
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  <HighlightedSearchText text={result.label} query={query} />
                </span>
                {result.detail && (
                  <span
                    style={{
                      display: "block",
                      overflow: "hidden",
                      marginTop: "2px",
                      color: "#777777",
                      fontSize: "11px",
                      lineHeight: 1.2,
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {result.detail}
                  </span>
                )}
              </span>
              {active && (
                <span
                  title="Press Enter to open"
                  style={{
                    flexShrink: 0,
                    color: "#666666",
                    fontSize: "17px",
                    lineHeight: 1,
                  }}
                >
                  <CornerDownLeft size={14} strokeWidth={1.8} />
                </span>
              )}
            </button>
          )
        })}
      </section>
    )
  }

  return (
    <div
      data-schematic-search
      onPointerDown={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
      style={{
        position: "relative",
        zIndex: zIndexMap.schematicSearch,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      {!isOpen ? (
        <button
          type="button"
          title="Search schematic"
          aria-label="Search schematic"
          onClick={() => {
            setIsOpen(true)
            requestAnimationFrame(() => inputRef.current?.focus())
          }}
          style={{
            width: "32px",
            height: "32px",
            display: "grid",
            placeItems: "center",
            padding: 0,
            border: "none",
            borderRadius: "4px",
            backgroundColor: "#ffffff",
            color: "#000000",
            cursor: "pointer",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          <Search size={16} strokeWidth={2} aria-hidden="true" />
        </button>
      ) : (
        <div
          onKeyDown={handleSearchKeyDown}
          style={{
            width: "min(280px, calc(100vw - 32px))",
            overflow: "hidden",
            border: "none",
            borderRadius: "4px",
            backgroundColor: "#ffffff",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              height: "32px",
              boxSizing: "border-box",
              padding: "0 12px",
              borderBottom: searchHeaderBorder,
            }}
          >
            <Search size={15} strokeWidth={2} aria-hidden="true" />
            <input
              ref={inputRef}
              value={query}
              aria-label="Search components and nets"
              placeholder="Search..."
              onChange={(event) => onQueryChange(event.target.value)}
              style={{
                minWidth: 0,
                flex: 1,
                border: "none",
                outline: "none",
                fontSize: "13px",
                color: "#222222",
                background: "transparent",
              }}
            />
            {query && results.length > 0 ? (
              <span
                style={{
                  flexShrink: 0,
                  color: "#888888",
                  fontSize: "12px",
                  whiteSpace: "nowrap",
                }}
              >
                {resultCountLabel}
              </span>
            ) : (
              <kbd
                style={{
                  flexShrink: 0,
                  padding: "2px 5px",
                  border: "1px solid #dddddd",
                  borderRadius: "4px",
                  backgroundColor: "#f7f7f7",
                  color: "#777777",
                  fontFamily: "inherit",
                  fontSize: "10px",
                  lineHeight: 1.2,
                }}
              >
                {shortcutLabel}
              </kbd>
            )}
            {isOpen && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={cancelSearch}
                style={{
                  border: "none",
                  background: "transparent",
                  color: "#777777",
                  cursor: "pointer",
                  width: "20px",
                  height: "20px",
                  display: "grid",
                  placeItems: "center",
                  padding: 0,
                  lineHeight: 1,
                }}
              >
                <X size={16} strokeWidth={2} aria-hidden="true" />
              </button>
            )}
          </div>
          {query && (
            <div
              ref={resultsListRef}
              style={{
                maxHeight: "240px",
                overflowX: "hidden",
                overflowY: "auto",
                overscrollBehavior: "contain",
                scrollBehavior: "smooth",
                touchAction: "pan-y",
                WebkitOverflowScrolling: "touch",
              }}
              onWheel={(event) => event.stopPropagation()}
              onTouchMove={(event) => event.stopPropagation()}
            >
              {results.length === 0 ? (
                <div
                  style={{
                    padding: "12px",
                    color: "#777777",
                    fontSize: "13px",
                  }}
                >
                  No matching components or nets
                </div>
              ) : (
                <>
                  {renderResultSection("components", componentResults)}
                  {renderResultSection("nets", netResults)}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
