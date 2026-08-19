import { useCallback, useEffect, useRef, useState } from "react"

interface ContextMenuProps {
  containerRef: React.RefObject<HTMLDivElement | null>
}

const LONG_PRESS_DURATION_MS = 600
const MOVEMENT_THRESHOLD_PX = 10

export const useContextMenu = ({ containerRef }: ContextMenuProps) => {
  const [menuVisible, setMenuVisible] = useState(false)
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 })
  const menuRef = useRef<HTMLDivElement>(null)
  const interactionOriginRef = useRef<{ x: number; y: number } | null>(null)
  const longPressTimeoutRef = useRef<number | null>(null)
  const ignoreContextMenuUntilRef = useRef(0)

  const clearLongPressTimeout = useCallback(() => {
    if (longPressTimeoutRef.current === null) return
    window.clearTimeout(longPressTimeoutRef.current)
    longPressTimeoutRef.current = null
  }, [])

  const handleContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault()

    if (Date.now() < ignoreContextMenuUntilRef.current) return

    const origin = interactionOriginRef.current
    if (!origin) return

    const movedTooFar =
      Math.abs(event.clientX - origin.x) > MOVEMENT_THRESHOLD_PX ||
      Math.abs(event.clientY - origin.y) > MOVEMENT_THRESHOLD_PX

    interactionOriginRef.current = null
    if (movedTooFar) return

    setMenuPos({ x: event.clientX, y: event.clientY })
    setMenuVisible(true)
  }, [])

  const handleTouchStart = useCallback(
    (event: React.TouchEvent) => {
      clearLongPressTimeout()

      if (event.touches.length !== 1) {
        interactionOriginRef.current = null
        return
      }

      const touch = event.touches[0]
      if (!touch) return

      interactionOriginRef.current = {
        x: touch.clientX,
        y: touch.clientY,
      }

      longPressTimeoutRef.current = window.setTimeout(() => {
        const container = containerRef.current
        if (!container || !interactionOriginRef.current) return

        const rect = container.getBoundingClientRect()
        setMenuPos({
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        })
        setMenuVisible(true)
        ignoreContextMenuUntilRef.current = Date.now() + 1_000
        interactionOriginRef.current = null
      }, LONG_PRESS_DURATION_MS)
    },
    [clearLongPressTimeout, containerRef],
  )

  const handleTouchMove = useCallback(
    (event: React.TouchEvent) => {
      const origin = interactionOriginRef.current
      if (!origin || event.touches.length !== 1) return

      const touch = event.touches[0]
      const movedTooFar =
        !touch ||
        Math.abs(touch.clientX - origin.x) > MOVEMENT_THRESHOLD_PX ||
        Math.abs(touch.clientY - origin.y) > MOVEMENT_THRESHOLD_PX

      if (movedTooFar) {
        interactionOriginRef.current = null
        clearLongPressTimeout()
      }
    },
    [clearLongPressTimeout],
  )

  const handleTouchEnd = useCallback(() => {
    clearLongPressTimeout()
    interactionOriginRef.current = null
  }, [clearLongPressTimeout])

  const handleClickAway = useCallback((event: MouseEvent | TouchEvent) => {
    const target = event.target as Node
    if (menuRef.current?.contains(target)) return

    const isInRadixPortal = (target as Element).closest?.(
      "[data-radix-popper-content-wrapper], [data-radix-dropdown-menu-content]",
    )
    if (isInRadixPortal) return

    setMenuVisible(false)
  }, [])

  useEffect(() => {
    if (!menuVisible) return

    document.addEventListener("mousedown", handleClickAway)
    document.addEventListener("touchstart", handleClickAway)
    return () => {
      document.removeEventListener("mousedown", handleClickAway)
      document.removeEventListener("touchstart", handleClickAway)
    }
  }, [handleClickAway, menuVisible])

  useEffect(() => clearLongPressTimeout, [clearLongPressTimeout])

  return {
    menuVisible,
    menuPos,
    menuRef,
    setMenuVisible,
    contextMenuEventHandlers: {
      onMouseDown: (event: React.MouseEvent) => {
        interactionOriginRef.current =
          event.button === 2 || (event.button === 0 && event.ctrlKey)
            ? { x: event.clientX, y: event.clientY }
            : null
      },
      onContextMenu: handleContextMenu,
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onTouchCancel: handleTouchEnd,
    },
  }
}
