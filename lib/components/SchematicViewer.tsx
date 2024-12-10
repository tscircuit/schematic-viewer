import { useMouseMatrixTransform } from "use-mouse-matrix-transform"
import { convertCircuitJsonToSchematicSvg } from "circuit-to-svg"
import { useEffect, useMemo, useRef, useState } from "react"
import { toString as transformToString } from "transformation-matrix"

interface Props {
  circuitJson: Array<{ type: string }>
}

export const SchematicViewer = ({ circuitJson }: Props) => {
  const svgDivRef = useRef<HTMLDivElement>(null)
  const { ref: containerRef } = useMouseMatrixTransform({
    onSetTransform(transform) {
      if (!svgDivRef.current) return
      svgDivRef.current.style.transform = transformToString(transform)
    },
  })
  const [containerWidth, setContainerWidth] = useState(0)
  const [containerHeight, setContainerHeight] = useState(0)

  useEffect(() => {
    if (!containerRef.current) return

    const updateDimensions = () => {
      const rect = containerRef.current?.getBoundingClientRect()

      setContainerWidth(rect?.width || 0)
      setContainerHeight(rect?.height || 0)
    }

    // Set initial dimensions
    updateDimensions()

    // Add resize listener
    const resizeObserver = new ResizeObserver(updateDimensions)
    resizeObserver.observe(containerRef.current)

    // Fallback to window resize
    window.addEventListener("resize", updateDimensions)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener("resize", updateDimensions)
    }
  }, [])

  const svg = useMemo(() => {
    if (!containerWidth || !containerHeight) return ""

    return convertCircuitJsonToSchematicSvg(circuitJson as any, {
      width: containerWidth,
      height: containerHeight || 720,
    })
  }, [circuitJson, containerWidth, containerHeight])

  return (
    <div
      ref={containerRef}
      style={{
        backgroundColor: "#F5F1ED",
        overflow: "hidden",
        cursor: "grab",
        minHeight: "300px",
        height: "100%",
      }}
    >
      <div
        ref={svgDivRef}
        style={{
          pointerEvents: "auto",
          transformOrigin: "0 0",
        }}
        // biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </div>
  )
}
