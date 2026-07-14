export function isMouseCaptureIgnoredTarget(
  target: EventTarget | null,
): boolean {
  const el = target as Element | null
  if (!el) return false
  return Boolean(
    el.closest(
      "[data-schematic-ignore-mouse-capture], input, textarea, select, option",
    ),
  )
}
