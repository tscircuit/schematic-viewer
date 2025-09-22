import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react"

export interface BoundingBoxBounds {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

interface BoundingBoxRegistration {
  bounds: BoundingBoxBounds | null
  onClick?: ((event: MouseEvent) => void) | undefined
}

export interface MouseTrackerContextValue {
  registerBoundingBox: (
    id: string,
    registration: BoundingBoxRegistration,
  ) => void
  updateBoundingBox: (id: string, registration: BoundingBoxRegistration) => void
  unregisterBoundingBox: (id: string) => void
  subscribe: (listener: () => void) => () => void
  isHovering: (id: string) => boolean
}

export const MouseTrackerContext =
  createContext<MouseTrackerContextValue | null>(null)

const boundsAreEqual = (
  a: BoundingBoxBounds | null | undefined,
  b: BoundingBoxBounds | null | undefined,
) => {
  if (!a && !b) return true
  if (!a || !b) return false
  return (
    a.minX === b.minX &&
    a.maxX === b.maxX &&
    a.minY === b.minY &&
    a.maxY === b.maxY
  )
}

export const MouseTracker = ({ children }: { children: ReactNode }) => {
  const existingContext = useContext(MouseTrackerContext)

  if (existingContext) {
    return <>{children}</>
  }

  const storeRef = useRef({
    pointer: null as { x: number; y: number } | null,
    boundingBoxes: new Map<string, BoundingBoxRegistration>(),
    hoveringIds: new Set<string>(),
    subscribers: new Set<() => void>(),
  })

  const notifySubscribers = useCallback(() => {
    for (const callback of storeRef.current.subscribers) {
      callback()
    }
  }, [])

  const updateHovering = useCallback(() => {
    const pointer = storeRef.current.pointer
    const newHovering = new Set<string>()

    if (pointer) {
      for (const [id, registration] of storeRef.current.boundingBoxes) {
        const bounds = registration.bounds
        if (!bounds) continue
        if (
          pointer.x >= bounds.minX &&
          pointer.x <= bounds.maxX &&
          pointer.y >= bounds.minY &&
          pointer.y <= bounds.maxY
        ) {
          newHovering.add(id)
        }
      }
    }

    const prevHovering = storeRef.current.hoveringIds
    if (
      newHovering.size === prevHovering.size &&
      [...newHovering].every((id) => prevHovering.has(id))
    ) {
      return
    }

    storeRef.current.hoveringIds = newHovering
    notifySubscribers()
  }, [notifySubscribers])

  const registerBoundingBox = useCallback(
    (id: string, registration: BoundingBoxRegistration) => {
      storeRef.current.boundingBoxes.set(id, registration)
      updateHovering()
    },
    [updateHovering],
  )

  const updateBoundingBox = useCallback(
    (id: string, registration: BoundingBoxRegistration) => {
      const existing = storeRef.current.boundingBoxes.get(id)
      if (
        existing &&
        boundsAreEqual(existing.bounds, registration.bounds) &&
        existing.onClick === registration.onClick
      ) {
        return
      }
      storeRef.current.boundingBoxes.set(id, registration)
      updateHovering()
    },
    [updateHovering],
  )

  const unregisterBoundingBox = useCallback(
    (id: string) => {
      const removed = storeRef.current.boundingBoxes.delete(id)
      if (removed) {
        updateHovering()
      }
    },
    [updateHovering],
  )

  const subscribe = useCallback((listener: () => void) => {
    storeRef.current.subscribers.add(listener)
    return () => {
      storeRef.current.subscribers.delete(listener)
    }
  }, [])

  const isHovering = useCallback((id: string) => {
    return storeRef.current.hoveringIds.has(id)
  }, [])

  useEffect(() => {
    const handlePointerPosition = (event: PointerEvent | MouseEvent) => {
      const { clientX, clientY } = event
      const pointer = storeRef.current.pointer
      if (pointer && pointer.x === clientX && pointer.y === clientY) {
        return
      }
      storeRef.current.pointer = { x: clientX, y: clientY }
      updateHovering()
    }

    const handlePointerLeave = () => {
      if (storeRef.current.pointer === null) return
      storeRef.current.pointer = null
      updateHovering()
    }

    const handleClick = (event: MouseEvent) => {
      const { clientX, clientY } = event
      for (const registration of storeRef.current.boundingBoxes.values()) {
        const bounds = registration.bounds
        if (!bounds) continue
        if (
          clientX >= bounds.minX &&
          clientX <= bounds.maxX &&
          clientY >= bounds.minY &&
          clientY <= bounds.maxY
        ) {
          registration.onClick?.(event)
        }
      }
    }

    window.addEventListener("pointermove", handlePointerPosition, {
      passive: true,
    })
    window.addEventListener("pointerdown", handlePointerPosition, {
      passive: true,
    })
    window.addEventListener("pointerup", handlePointerPosition, {
      passive: true,
    })
    window.addEventListener("pointerleave", handlePointerLeave)
    window.addEventListener("pointercancel", handlePointerLeave)
    window.addEventListener("blur", handlePointerLeave)
    window.addEventListener("click", handleClick, { passive: true })

    return () => {
      window.removeEventListener("pointermove", handlePointerPosition)
      window.removeEventListener("pointerdown", handlePointerPosition)
      window.removeEventListener("pointerup", handlePointerPosition)
      window.removeEventListener("pointerleave", handlePointerLeave)
      window.removeEventListener("pointercancel", handlePointerLeave)
      window.removeEventListener("blur", handlePointerLeave)
      window.removeEventListener("click", handleClick)
    }
  }, [updateHovering])

  const value = useMemo<MouseTrackerContextValue>(
    () => ({
      registerBoundingBox,
      updateBoundingBox,
      unregisterBoundingBox,
      subscribe,
      isHovering,
    }),
    [
      registerBoundingBox,
      updateBoundingBox,
      unregisterBoundingBox,
      subscribe,
      isHovering,
    ],
  )

  return (
    <MouseTrackerContext.Provider value={value}>
      {children}
    </MouseTrackerContext.Provider>
  )
}
