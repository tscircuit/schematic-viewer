import { useEffect, useState } from "react"

export const useResizeHandling = (
  containerRef: React.RefObject<HTMLElement>,
) => {
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

  return { containerWidth, containerHeight }
}
