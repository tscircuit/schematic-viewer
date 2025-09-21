import {
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useSyncExternalStore,
} from "react"
import {
  MouseTrackerContext,
  type BoundingBoxBounds,
} from "../components/MouseTracker"

interface UseMouseEventsOverBoundingBoxOptions {
  bounds: BoundingBoxBounds | null
  onClick?: (event: MouseEvent) => void
}

export const useMouseEventsOverBoundingBox = (
  options: UseMouseEventsOverBoundingBoxOptions,
) => {
  const context = useContext(MouseTrackerContext)

  if (!context) {
    throw new Error(
      "useMouseEventsOverBoundingBox must be used within a MouseTracker",
    )
  }

  const id = useId()
  const latestOptionsRef = useRef(options)
  latestOptionsRef.current = options

  const handleClick = useMemo(
    () => (event: MouseEvent) => {
      latestOptionsRef.current.onClick?.(event)
    },
    [],
  )

  useEffect(() => {
    context.registerBoundingBox(id, {
      bounds: latestOptionsRef.current.bounds,
      onClick: latestOptionsRef.current.onClick ? handleClick : undefined,
    })
    return () => {
      context.unregisterBoundingBox(id)
    }
  }, [context, handleClick, id])

  useEffect(() => {
    context.updateBoundingBox(id, {
      bounds: latestOptionsRef.current.bounds,
      onClick: latestOptionsRef.current.onClick ? handleClick : undefined,
    })
  }, [
    context,
    handleClick,
    id,
    options.bounds?.minX,
    options.bounds?.maxX,
    options.bounds?.minY,
    options.bounds?.maxY,
    options.onClick,
  ])

  const hovering = useSyncExternalStore(
    context.subscribe,
    () => context.isHovering(id),
    () => false,
  )

  return { hovering }
}
